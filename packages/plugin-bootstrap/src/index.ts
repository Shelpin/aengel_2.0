import type {
    IAgentRuntime,
    Plugin,
    ClientInstance,
    ClientConfig,
    Memory,
} from "@elizaos/core";
import type {
    PluginContext,
    Action,
    Evaluator,
    Provider
} from "@elizaos/types";
import { continueAction } from "./actions/continue.js";
import { followRoomAction } from "./actions/followRoom.js";
import { ignoreAction } from "./actions/ignore.js";
import { muteRoomAction } from "./actions/muteRoom.js";
import { noneAction } from "./actions/none.js";
import { unfollowRoomAction } from "./actions/unfollowRoom.js";
import { unmuteRoomAction } from "./actions/unmuteRoom.js";
import { factEvaluator } from "./evaluators/fact.js";
import { goalEvaluator } from "./evaluators/goal.js";
import { boredomProvider } from "./providers/boredom.js";
import { factsProvider } from "./providers/facts.js";
import { timeProvider } from "./providers/time.js";

// Define the arrays of actions, evaluators, and providers separately
const bootstrapActions: Action[] = [
    continueAction,
    ignoreAction,
    noneAction,
    followRoomAction,
    unfollowRoomAction,
    muteRoomAction,
    unmuteRoomAction,
];
const bootstrapEvaluators: Evaluator[] = [goalEvaluator, factEvaluator];
const bootstrapProviders: Provider[] = [boredomProvider, timeProvider, factsProvider];

const elizaBootstrapPlugin: Plugin = {
    name: "@elizaos/plugin-bootstrap",
    version: "0.1.0", // Example version

    // Keep PluginContext signature to satisfy the Plugin interface
    async initialize(context: PluginContext) {
        console.log(">>>> ENTERING bootstrapPlugin.initialize <<<<"); // RAW LOG

        // Treat context AS the runtime, since that's what AgentRuntime passes
        const runtime = context as any as PluginContext['runtime']; // Cast to runtime type

        if (!runtime) {
            console.error("!!! bootstrapPlugin.initialize: runtime (derived from context) is MISSING !!!");
            return;
        }
        console.log(`>>>> bootstrapPlugin.initialize: runtime type: ${typeof runtime}`);

        if (!runtime.logger) {
            console.error("!!! bootstrapPlugin.initialize: runtime.logger is MISSING !!!");
            console.log(`>>>> bootstrapPlugin.initialize: runtime keys: ${Object.keys(runtime).join(', ')}`);
            return;
        }
        console.log(`>>>> bootstrapPlugin.initialize: runtime.logger type: ${typeof runtime.logger}`);

        // Original logic using the direct runtime argument
        runtime.logger.info(`Plugin ${this.name} initialized.`); // Use runtime.logger directly
        console.log(">>>> bootstrapPlugin.initialize: SUCCESSFULLY LOGGED via runtime.logger <<<<");
        // TODO: Register actions, evaluators, providers using the runtime
        // Example: runtime.registerActions(bootstrapActions);
        // Example: runtime.registerEvaluators(bootstrapEvaluators);
        // Example: runtime.registerProviders(bootstrapProviders);
    },

    async shutdown() {
        // TODO: Add cleanup logic if needed
        console.log(`Plugin ${this.name} shutting down.`);
    },

    // Removed actions, evaluators, providers properties
    // They should be handled within initialize
};

export default elizaBootstrapPlugin;

// Export individual components if they need to be accessible directly elsewhere
export {
    bootstrapActions,
    bootstrapEvaluators,
    bootstrapProviders,
    continueAction,
    ignoreAction,
    noneAction,
    followRoomAction,
    unfollowRoomAction,
    muteRoomAction,
    unmuteRoomAction,
    goalEvaluator,
    factEvaluator,
    boredomProvider,
    factsProvider,
    timeProvider,
};
