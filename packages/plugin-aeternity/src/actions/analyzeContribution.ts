import { z } from 'zod';
import { ContributionAnalyzerService, ContributionLevel, ContributionType, ContributionAnalysis } from '../services/ContributionAnalyzerService';
import { ServiceType } from '@elizaos/core';
import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';

// Input schema for analyzeContribution action
export const analyzeContributionSchema = z.object({
  // Description of the contribution
  description: z.string().min(1),
  
  // Optional contributor username
  contributor: z.string().optional(),
  
  // Optional contribution type
  type: z.nativeEnum(ContributionType).optional(),
  
  // Optional additional context
  context: z.string().optional(),
  
  // Optional flag to force tip even if LLM evaluation says no
  forceTip: z.boolean().optional(),
});

// Input type derived from schema
export type AnalyzeContributionInput = z.infer<typeof analyzeContributionSchema>;

// Output type for analyzeContribution action
export type AnalyzeContributionOutput = {
  analysis: ContributionAnalysis;
  suggestedTipAmount: string;
  deservesTip: boolean;
  llmConfidence?: number; // Confidence level from LLM if available
  reasonForTip?: string;  // Reasoning from LLM if available
};

/**
 * Analyze a contribution and provide a recommended tip amount using ElizaOS LLM
 * @param input - Analysis parameters
 * @param context - Action context
 * @returns Analysis and recommended tip
 */
export const analyzeContribution = async (
  input: AnalyzeContributionInput,
  context: any
): Promise<AnalyzeContributionOutput> => {
  try {
    // Validate input
    const params = analyzeContributionSchema.parse(input);
    
    // Retrieve the ContributionAnalyzerService
    const contributionAnalyzer = context.runtime.getService(ServiceType.TEXT_GENERATION) as ContributionAnalyzerService;
    
    // Analyze the contribution
    const level = await contributionAnalyzer.analyzeContribution(params.description);
    
    // Get recommended tip amount
    const recommendedAmount = contributionAnalyzer.getTipAmount(level);
    
    // Determine contribution type
    const type = params.type || await determineContributionType(params.description, context.runtime);
    
    // Determine if contribution deserves a tip
    const deservesTip = params.forceTip || await contributionAnalyzer.shouldTip(params.description);
    
    // Get LLM reasoning if available
    let reasonForTip: string | undefined;
    let llmConfidence: number | undefined;
    
    if (context.runtime.llm) {
      try {
        // Get detailed reasoning from LLM
        const reasoning = await context.runtime.llm.generateResponse({
          prompt: `Analyze this contribution in a Telegram group: "${params.description}"
                  1. Explain in 1-2 sentences why this contribution is valuable (or not valuable).
                  2. Rate your confidence in this assessment on a scale of 0-100.
                  Format your response as:
                  Reason: [your reason]
                  Confidence: [number 0-100]`,
          maxTokens: 100
        });
        
        // Extract reason and confidence from LLM response
        const reasonMatch = reasoning.match(/Reason:\s*(.+?)(?:\s*Confidence:|$)/s);
        const confidenceMatch = reasoning.match(/Confidence:\s*(\d+)/);
        
        if (reasonMatch && reasonMatch[1]) {
          reasonForTip = reasonMatch[1].trim();
        }
        
        if (confidenceMatch && confidenceMatch[1]) {
          const confidenceValue = parseInt(confidenceMatch[1], 10);
          if (!isNaN(confidenceValue) && confidenceValue >= 0 && confidenceValue <= 100) {
            llmConfidence = confidenceValue / 100; // Convert to 0-1 scale
          }
        }
      } catch (error) {
        console.error('Error getting LLM reasoning:', error);
        // Continue without LLM reasoning if it fails
      }
    }
    
    // Calculate a confidence score
    const confidenceScore = llmConfidence ?? calculateConfidenceScore(params.description, level);
    
    // Create analysis result
    const analysis: ContributionAnalysis = {
      level,
      type,
      recommendedAmount,
      confidenceScore,
      deservesTip
    };
    
    return {
      analysis,
      suggestedTipAmount: recommendedAmount,
      deservesTip,
      llmConfidence,
      reasonForTip
    };
  } catch (error) {
    console.error('Failed to analyze contribution:', error);
    throw error;
  }
};

/**
 * Determine the contribution type based on description using ElizaOS LLM if available
 * @param description - Contribution description
 * @param runtime - ElizaOS runtime for LLM access
 * @returns The determined contribution type
 */
async function determineContributionType(description: string, runtime: any): Promise<ContributionType> {
  try {
    if (runtime && runtime.llm) {
      const analysis = await runtime.llm.generateResponse({
        prompt: `Categorize this Telegram contribution: "${description}"
                Choose ONE category from this list:
                - QUESTION_ANSWER (solving problems or answering questions)
                - CODE_SHARE (sharing code snippets or scripts)
                - TUTORIAL (step-by-step guides)
                - RESOURCE_SHARING (articles, links, documentation)
                - COMMUNITY_SUPPORT (helping new users, welcoming)
                - BUG_REPORT (reporting issues or problems)
                - TECHNICAL_EXPLANATION (explaining concepts or techniques)
                - OTHER (none of the above)
                Respond with ONLY the category name.`,
        maxTokens: 20
      });
      
      const category = analysis.trim().toUpperCase();
      
      // Map LLM response to ContributionType enum
      const typeMap: Record<string, ContributionType> = {
        'QUESTION_ANSWER': ContributionType.QUESTION_ANSWER,
        'CODE_SHARE': ContributionType.CODE_SHARE,
        'TUTORIAL': ContributionType.TUTORIAL,
        'RESOURCE_SHARING': ContributionType.RESOURCE_SHARING,
        'COMMUNITY_SUPPORT': ContributionType.COMMUNITY_SUPPORT,
        'BUG_REPORT': ContributionType.BUG_REPORT,
        'TECHNICAL_EXPLANATION': ContributionType.TECHNICAL_EXPLANATION,
      };
      
      return typeMap[category] || ContributionType.OTHER;
    }
  } catch (error) {
    console.error('Error determining contribution type with LLM:', error);
    // Continue with keyword-based approach on error
  }
  
  // Fallback to keyword-based approach
  return keywordBasedTypeDetermination(description);
}

/**
 * Determine the contribution type based on keywords (fallback method)
 * @param description - Contribution description
 * @returns The determined contribution type
 */
function keywordBasedTypeDetermination(description: string): ContributionType {
  const normalizedText = description.toLowerCase();
  
  // Simple heuristics for type detection
  if (normalizedText.includes('question') || normalizedText.includes('answer') || 
      normalizedText.includes('solved') || normalizedText.includes('solution')) {
    return ContributionType.QUESTION_ANSWER;
  }
  
  if (normalizedText.includes('code') || normalizedText.includes('script') || 
      normalizedText.includes('function') || normalizedText.includes('github')) {
    return ContributionType.CODE_SHARE;
  }
  
  if (normalizedText.includes('tutorial') || normalizedText.includes('guide') || 
      normalizedText.includes('how to') || normalizedText.includes('step by step')) {
    return ContributionType.TUTORIAL;
  }
  
  if (normalizedText.includes('article') || normalizedText.includes('link') || 
      normalizedText.includes('resource') || normalizedText.includes('documentation')) {
    return ContributionType.RESOURCE_SHARING;
  }
  
  if (normalizedText.includes('help') || normalizedText.includes('support') || 
      normalizedText.includes('community') || normalizedText.includes('welcome')) {
    return ContributionType.COMMUNITY_SUPPORT;
  }
  
  if (normalizedText.includes('bug') || normalizedText.includes('issue') || 
      normalizedText.includes('problem') || normalizedText.includes('fix')) {
    return ContributionType.BUG_REPORT;
  }
  
  if (normalizedText.includes('explain') || normalizedText.includes('explanation') || 
      normalizedText.includes('concept') || normalizedText.includes('technique')) {
    return ContributionType.TECHNICAL_EXPLANATION;
  }
  
  return ContributionType.OTHER;
}

/**
 * Calculate a confidence score for the analysis
 * @param description - Contribution description
 * @param level - Determined contribution level
 * @returns Confidence score (0-1)
 */
function calculateConfidenceScore(description: string, level: ContributionLevel): number {
  // Simple implementation - length of description affects confidence
  const lengthScore = Math.min(description.length / 200, 0.5);
  
  // Base confidence by level (higher levels need more evidence)
  const baseLevelConfidence = {
    [ContributionLevel.MINOR]: 0.8,
    [ContributionLevel.HELPFUL]: 0.7,
    [ContributionLevel.VALUABLE]: 0.6,
    [ContributionLevel.MAJOR]: 0.5,
    [ContributionLevel.EXCEPTIONAL]: 0.4,
  };
  
  // Combined score
  return Math.min(baseLevelConfidence[level] + lengthScore, 1.0);
}

// Action descriptor for analyzeContribution
export const analyzeContributionAction: Action = {
  name: 'ANALYZE_CONTRIBUTION',
  similes: ['ANALYZE_CONTRIBUTION'],
  description: 'Analyze a Telegram contribution using ElizaOS LLM and get recommended tip amount',
  examples: [
    {
      input: {
        description: "Fixed bug #123 in the payment system that was blocking transactions",
        contributor: "developer123",
        type: "BUG_REPORT",
        context: "Github issue discussion"
      },
      output: {
        analysis: {
          level: "VALUABLE",
          type: "BUG_REPORT",
          recommendedAmount: "2.0",
          confidenceScore: 0.85,
          deservesTip: true
        },
        suggestedTipAmount: "2.0",
        deservesTip: true,
        reasonForTip: "Fixed a critical bug that was preventing transactions"
      }
    }
  ],
  validate: async (runtime: IAgentRuntime) => true,
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    callback?: HandlerCallback
  ) => {
    const content = message.content as any;
    const input = analyzeContributionSchema.parse({ ...(content as Record<string, any>) });
    const result = await analyzeContribution(input, { runtime });
    if (callback) {
      await callback({ text: `Analysis: ${result.analysis.level}, Tip: ${result.suggestedTipAmount}` });
    }
    return true;
  },
}; 