import type { ActionResponse } from './types.js';
export declare const messageCompletionFooter = "\nResponse format should be formatted in a valid JSON block like this:\n```json\n{ \"user\": \"{{agentName}}\", \"text\": \"<string>\", \"action\": \"<string>\" }\n```\n\nThe \u201Caction\u201D field should be one of the options in [Available Actions] and the \"text\" field should be the response you want to send.\n";
export declare const shouldRespondFooter = "The available options are [RESPOND], [IGNORE], or [STOP]. Choose the most appropriate option.\nIf {{agentName}} is talking too much, you can choose [IGNORE]\n\nYour response must include one of the options.";
export declare const parseShouldRespondFromText: (text: string) => "RESPOND" | "IGNORE" | "STOP" | null;
export declare const booleanFooter = "Respond with only a YES or a NO.";
/**
 * Parses a string to determine its boolean equivalent.
 *
 * Recognized affirmative values: "YES", "Y", "TRUE", "T", "1", "ON", "ENABLE".
 * Recognized negative values: "NO", "N", "FALSE", "F", "0", "OFF", "DISABLE".
 *
 * @param {string} text - The input text to parse.
 * @returns {boolean|null} - Returns `true` for affirmative inputs, `false` for negative inputs, and `null` for unrecognized inputs or null/undefined.
 */
export declare const parseBooleanFromText: (text: string) => boolean;
export declare const stringArrayFooter = "Respond with a JSON array containing the values in a valid JSON block formatted for markdown with this structure:\n```json\n[\n  'value',\n  'value'\n]\n```\n\nYour response must include the valid JSON block.";
/**
 * Parses a JSON array from a given text. The function looks for a JSON block wrapped in triple backticks
 * with `json` language identifier, and if not found, it searches for an array pattern within the text.
 * It then attempts to parse the JSON string into a JavaScript object. If parsing is successful and the result
 * is an array, it returns the array; otherwise, it returns null.
 *
 * @param text - The input text from which to extract and parse the JSON array.
 * @returns An array parsed from the JSON string if successful; otherwise, null.
 */
export declare function parseJsonArrayFromText(text: string): any[];
/**
 * Parses a JSON object from a given text. The function looks for a JSON block wrapped in triple backticks
 * with `json` language identifier, and if not found, it searches for an object pattern within the text.
 * It then attempts to parse the JSON string into a JavaScript object. If parsing is successful and the result
 * is an object (but not an array), it returns the object; otherwise, it tries to parse an array if the result
 * is an array, or returns null if parsing is unsuccessful or the result is neither an object nor an array.
 *
 * @param text - The input text from which to extract and parse the JSON object.
 * @returns An object parsed from the JSON string if successful; otherwise, null or the result of parsing an array.
 */
export declare function parseJSONObjectFromText(text: string): Record<string, any> | null;
/**
 * Extracts specific attributes (e.g., user, text, action) from a JSON-like string using regex.
 * @param response - The cleaned string response to extract attributes from.
 * @param attributesToExtract - An array of attribute names to extract.
 * @returns An object containing the extracted attributes.
 */
export declare function extractAttributes(response: string, attributesToExtract?: string[]): {
    [key: string]: string | undefined;
};
/**
 * Normalizes a JSON-like string by correcting formatting issues:
 * - Removes extra spaces after '{' and before '}'.
 * - Wraps unquoted values in double quotes.
 * - Converts single-quoted values to double-quoted.
 * - Ensures consistency in key-value formatting.
 * - Normalizes mixed adjacent quote pairs.
 *
 * This is useful for cleaning up improperly formatted JSON strings
 * before parsing them into valid JSON.
 *
 * @param str - The JSON-like string to normalize.
 * @returns A properly formatted JSON string.
 */
export declare const normalizeJsonString: (str: string) => string;
/**
 * Cleans a JSON-like response string by removing unnecessary markers, line breaks, and extra whitespace.
 * This is useful for handling improperly formatted JSON responses from external sources.
 *
 * @param response - The raw JSON-like string response to clean.
 * @returns The cleaned string, ready for parsing or further processing.
 */
export declare function cleanJsonResponse(response: string): string;
export declare const postActionResponseFooter = "Choose any combination of [LIKE], [RETWEET], [QUOTE], and [REPLY] that are appropriate. Each action must be on its own line. Your response must only include the chosen actions.";
export declare const parseActionResponseFromText: (text: string) => {
    actions: ActionResponse;
};
/**
 * Truncate text to fit within the character limit, ensuring it ends at a complete sentence.
 */
export declare function truncateToCompleteSentence(text: string, maxLength: number): string;
