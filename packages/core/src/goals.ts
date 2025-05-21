import type {
    IAgentRuntime,
    Objective,
    UUID,
    Goal as DatabaseGoalType
} from './types.js';
import { elizaLogger as logger } from './logger.js';

/**
 * Get all goals for an agent in a given room.
 */
export async function getGoals({
    runtime,
    roomId,
    userId,
    onlyInProgress,
    count,
}: {
    runtime: IAgentRuntime;
    roomId: string;
    userId?: string;
    onlyInProgress?: boolean;
    count?: number;
}): Promise<any[]> {
    if (!runtime.databaseAdapter) {
        console.warn("Database adapter is not available in getGoals");
        return [];
    }
    return runtime.databaseAdapter.getGoals({
        agentId: runtime.agentId,
        roomId,
        userId,
        onlyInProgress,
        count,
    });
}

export const formatGoalsAsString = ({ goals }: { goals: DatabaseGoalType[] }) => {
    const goalStrings = goals.map((goal: DatabaseGoalType) => {
        const header = `Goal: ${goal.name || 'Unnamed Goal'}\nid: ${goal.id}`;
        const objectives =
            "Objectives:\n" +
            (goal.objectives || [])
                .map((objective: Objective) => {
                    return `- ${objective.completed ? "[x]" : "[ ]"} ${objective.description} ${objective.completed ? " (DONE)" : " (IN PROGRESS)"}`;
                })
                .join("\n");
        return `${header}\n${objectives}`;
    });
    return goalStrings.join("\n");
};

export const updateGoal = async ({
    runtime,
    goal,
}: {
    runtime: IAgentRuntime;
    goal: DatabaseGoalType;
}) => {
    if (!runtime.databaseAdapter) {
        console.warn("Database adapter is not available in updateGoal");
        return null;
    }
    return runtime.databaseAdapter.updateGoal(goal);
};

export const createGoal = async ({
    runtime,
    goal,
}: {
    runtime: IAgentRuntime;
    goal: DatabaseGoalType;
}) => {
    if (!runtime.databaseAdapter) {
        console.warn("Database adapter is not available in createGoal");
        return null;
    }
    return runtime.databaseAdapter.createGoal(goal);
};
