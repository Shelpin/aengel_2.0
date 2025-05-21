import { composeContext } from "@elizaos/core";
import { generateObjectArray } from "@elizaos/core";
import { MemoryManager } from "@elizaos/core";
import { stringToUuid } from "@elizaos/core";
import { v4 as uuidv4 } from 'uuid';
import type {
    ActionExample,
    Evaluator,
    Provider,
    Memory,
    State,
    IAgentRuntime
} from "@elizaos/core";
import { ModelClass } from "@elizaos/core";

export const formatFacts = (facts: Memory[]) => {
    const messageStrings = facts
        .reverse()
        .map((fact: Memory) => fact.content.text);
    const finalMessageStrings = messageStrings.join("\n");
    return finalMessageStrings;
};

const factsTemplate =
    // {{actors}}
    `TASK: Extract Claims from the conversation as an array of claims in JSON format.

# START OF EXAMPLES
These are examples of the expected output of this task:
{{evaluationExamples}}
# END OF EXAMPLES

# INSTRUCTIONS

Extract any claims from the conversation that are not already present in the list of known facts above:
- Try not to include already-known facts. If you think a fact is already known, but you're not sure, respond with already_known: true.
- If the fact is already in the user's description, set in_bio to true
- If we've already extracted this fact, set already_known to true
- Set the claim type to 'status', 'fact' or 'opinion'
- For true facts about the world or the character that do not change, set the claim type to 'fact'
- For facts that are true but change over time, set the claim type to 'status'
- For non-facts, set the type to 'opinion'
- 'opinion' includes non-factual opinions and also includes the character's thoughts, feelings, judgments or recommendations
- Include any factual detail, including where the user lives, works, or goes to school, what they do for a living, their hobbies, and any other relevant information

Recent Messages:
{{recentMessages}}

Response should be a JSON object array inside a JSON markdown block. Correct response format:
\`\`\`json
[
  {"claim": string, "type": enum<fact|opinion|status>, in_bio: boolean, already_known: boolean },
  {"claim": string, "type": enum<fact|opinion|status>, in_bio: boolean, already_known: boolean },
  ...
]
\`\`\``;

async function handler(runtime: IAgentRuntime, message: Memory) {
    const state = await runtime.composeState(message);

    const { agentId, roomId } = state;

    const context = composeContext({
        state,
        template: runtime.character.templates?.factsTemplate || factsTemplate,
    });

    const facts = await generateObjectArray({
        runtime,
        context,
        modelClass: ModelClass.LARGE,
    });

    const factsManager = new MemoryManager({
        runtime,
        tableName: "facts",
    });

    if (!facts) {
        return [];
    }

    // If the fact is known or corrupted, remove it
    const filteredFacts = facts
        .filter((fact) => {
            return (
                !fact.already_known &&
                fact.type === "fact" &&
                !fact.in_bio &&
                fact.claim &&
                fact.claim.trim() !== ""
            );
        })
        .map((fact) => fact.claim);

    for (const fact of filteredFacts) {
        const safeAgentId = typeof agentId === 'string'
            ? stringToUuid(agentId)
            : agentId || stringToUuid("00000000-0000-0000-0000-000000000000");

        // Construct a valid Memory object
        const memoryToEmbed: Memory = {
            id: uuidv4(), // Generate a unique ID
            userId: safeAgentId, // Assuming agentId is the intended user here for facts
            agentId: safeAgentId, // Include agentId if necessary for context
            roomId,
            content: {
                text: fact,
                type: "fact" // Move type inside content
            },
            createdAt: Date.now(),
            importance: 0.8, // Assign a default importance
            lastAccessed: Date.now(),
        };

        const factMemory = await factsManager.addEmbeddingToMemory(memoryToEmbed);

        // Ensure createMemory receives the object *with* the embedding
        await factsManager.createMemory(factMemory, true);

        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return filteredFacts;
}

export const factEvaluator: Evaluator = {
    name: "GET_FACTS",
    similes: [
        "GET_CLAIMS",
        "EXTRACT_CLAIMS",
        "EXTRACT_FACTS",
        "EXTRACT_CLAIM",
        "EXTRACT_INFORMATION",
    ],
    validate: async (
        runtime: IAgentRuntime,

        message: Memory
    ): Promise<boolean> => {
        const messageCount = (await runtime.messageManager.countMemories(
            message.roomId
        )) as number;

        const reflectionCount = Math.ceil(runtime.getConversationLength() / 2);

        return messageCount % reflectionCount === 0;
    },
    description:
        "Extract factual information about the people in the conversation, the current events in the world, and anything else that might be important to remember.",
    handler,
    examples: [
        {
            context: `Actors in the scene:
{{user1}}: Programmer and moderator of the local story club.
{{user2}}: New member of the club. Likes to write and read.

Facts about the actors:
None`,
            messages: [
                {
                    user: "{{user1}}",
                    content: { text: "So where are you from" },
                },
                {
                    user: "{{user2}}",
                    content: { text: "I'm from the city" },
                },
                {
                    user: "{{user1}}",
                    content: { text: "Which city?" },
                },
                {
                    user: "{{user2}}",
                    content: { text: "Oakland" },
                },
                {
                    user: "{{user1}}",
                    content: {
                        text: "Oh, I've never been there, but I know it's in California",
                    },
                },
            ] as ActionExample[],
            outcome: `{ "claim": "{{user2}} is from Oakland", "type": "fact", "in_bio": false, "already_known": false },`,
        },
        {
            context: `Actors in the scene:
{{user1}}: Athelete and cyclist. Worked out every day for a year to prepare for a marathon.
{{user2}}: Likes to go to the beach and shop.

Facts about the actors:
{{user1}} and {{user2}} are talking about the marathon
{{user1}} and {{user2}} have just started dating`,
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "I finally completed the marathon this year!",
                    },
                },
                {
                    user: "{{user2}}",
                    content: { text: "Wow! How long did it take?" },
                },
                {
                    user: "{{user1}}",
                    content: { text: "A little over three hours." },
                },
                {
                    user: "{{user1}}",
                    content: { text: "I'm so proud of myself." },
                },
            ] as ActionExample[],
            outcome: `Claims:
\`\`\`json
[
  { "claim": "Alex just completed a marathon in just under 4 hours.", "type": "fact", "in_bio": false, "already_known": false },
  { "claim": "Alex worked out 2 hours a day at the gym for a year.", "type": "fact", "in_bio": true, "already_known": false },
  { "claim": "Alex is really proud of himself.", "type": "opinion", "in_bio": false, "already_known": false }
]
\`\`\``,
        },
    ],
};