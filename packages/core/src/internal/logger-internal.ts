import pino, { type LogFn } from "pino";
import pretty from "pino-pretty";

// Helper function instead of importing from parsing.ts
const parseBooleanFromText = (text: string | undefined): boolean => {
    if (!text) return false;
    const lowercaseText = text.toLowerCase();
    return (
        lowercaseText === "true" ||
        lowercaseText === "1" ||
        lowercaseText === "yes" ||
        lowercaseText === "y"
    );
};

const customLevels: Record<string, number> = {
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    log: 29,
    progress: 28,
    success: 27,
    debug: 20,
    trace: 10,
};

const raw = parseBooleanFromText(process?.env?.LOG_JSON_FORMAT) || false;

const createStream = () => {
    if (raw) {
        return undefined;
    }
    return pretty({
        colorize: true,
        translateTime: "yyyy-mm-dd HH:MM:ss",
        ignore: "pid,hostname",
    });
};

const defaultLevel = process?.env?.DEFAULT_LOG_LEVEL || "info";

const options = {
    level: defaultLevel,
    customLevels,
    hooks: {
        logMethod(
            inputArgs: [string | Record<string, unknown>, ...unknown[]],
            method: LogFn
        ): void {
            const [arg1, ...rest] = inputArgs;

            if (typeof arg1 === "object" && arg1 !== null) {
                // First arg is an object (bindings)
                const messageParts = rest.filter(arg => typeof arg === 'string');
                const message = messageParts.join(" ");
                const remainingArgs = rest.filter(arg => typeof arg !== 'string');
                // @ts-ignore - Bypass persistent type error for pino hook apply
                method.apply(this, [arg1, message, ...remainingArgs]);
            } else {
                // First arg is string (or something else treated as part of message)
                const context = {}; // Collect other potential objects here
                const messageParts = [arg1, ...rest].map((arg) =>
                    typeof arg === "string" ? arg : arg
                );
                const message = messageParts
                    .filter((part): part is string => typeof part === "string")
                    .join(" ");
                const jsonParts = messageParts.filter(
                    (part): part is Record<string, unknown> => typeof part === "object" && part !== null
                );
                Object.assign(context, ...jsonParts);
                // Pass message first, then context object for pino
                // @ts-ignore - Bypass potential type error for pino hook apply (second case)
                method.apply(this, [message, context]);
            }

        },
    },
};

// Fix the pino constructor call to handle type issues
// @ts-expect-error - pino is actually callable but TypeScript doesn't recognize it properly
export const elizaLogger = pino(options, createStream());

export default elizaLogger;