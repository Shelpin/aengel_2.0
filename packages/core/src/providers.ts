import type { IAgentRuntime, State, Memory, Provider } from './types.js';

/**
 * Formats provider outputs into a string which can be injected into the context.
 * @param runtime The AgentRuntime object.
 * @param message The incoming message object.
 * @param state The current state object.
 * @returns A string that concatenates the outputs of each provider.
 */
export async function getProviders(
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
) {
    if (!runtime.providers || runtime.providers.length === 0) {
        return ""; // No providers to process
    }
    const providerResults = (
        await Promise.all(
            runtime.providers.map(async (provider: Provider) => {
                return await provider.get(runtime, message, state);
            })
        )
    ).filter((result: unknown) => result != null && result !== "");

    return providerResults.join("\n");
}
