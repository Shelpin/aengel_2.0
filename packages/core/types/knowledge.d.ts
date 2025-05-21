import type { Memory } from './types.js';
import type { IAgentRuntimeBridge } from './api/types.js';
declare function get(runtime: IAgentRuntimeBridge, message: Memory): Promise<any>;
declare function set(runtime: IAgentRuntimeBridge, item: any): Promise<void>;
export declare function preprocess(content: string): string;
declare const _default: {
    get: typeof get;
    set: typeof set;
    preprocess: typeof preprocess;
};
export default _default;
