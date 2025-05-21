# Plan: Streamline for Single Telegram Agent (ængel)

This document outlines the steps to modify the cloned `aeternalsv2` project (now named `eliza`) to support a single agent, "ængel", operating exclusively through Telegram. This involves removing multi-agent capabilities, the associated relay server, and other non-essential components inherited from the original repository.

## I. Project Structure and Dependency Review:

1.  **Analyze `package.json` (Root and Workspaces):**
    *   Identify dependencies specifically related to:
        *   Multi-agent management (if any custom logic was built beyond standard ElizaOS features).
        *   The "relay server" functionality.
        *   Any other plugins or packages from `aeternalsv2` not required for a single Telegram-based agent (e.g., other client integrations if they are heavily intertwined and not easily separable by just omitting them from character config).
    *   List these dependencies for removal.
    *   Check scripts in `package.json` for any commands related to multi-agent, relay server, or other now-removed components. These will need to be removed or updated.

2.  **Examine Project Files and Directories:**
    *   Locate code specifically implementing the multi-agent logic. This might be in `agent/src/`, `packages/`, or custom scripts.
    *   Identify code for the "relay server".
    *   Pinpoint any configuration files or utilities solely for these removed features.
    *   List all files/directories for deletion or significant modification.

## II. Code and Configuration Modifications:

1.  **Remove Multi-Agent and Relay Server Code:**
    *   Delete the identified files and directories.
    *   Carefully refactor any shared code to ensure the core agent functionality for "ængel" remains intact.
    *   Pay close attention to entry points (e.g., `agent/src/index.ts` or custom start scripts) to remove any logic that tries to load multiple agents or the relay server.

2.  **Update Agent Startup Logic:**
    *   Modify the primary startup script (e.g., `agent/src/index.ts`, or a custom script like the `start-agent.ts` we worked on previously) to:
        *   Load only the "ængel" character.
        *   Initialize only the Telegram client for "ængel".
        *   Remove any dynamic agent loading or selection logic.
        *   Ensure environment variables are correctly piped for a single agent setup (especially `TELEGRAM_BOT_TOKEN`).

3.  **Consolidate Character Configuration:**
    *   Confirm `eliza/characters/aengel.json` is the definitive character file.
    *   Ensure `aengel.json` correctly specifies `clients: ["telegram"]` and remove any other client declarations unless they are intended to be used later (like Twitter).
    *   Review `settings.secrets` in `aengel.json` – it should generally be empty if secrets are primarily managed via `.env` for a single agent.

4.  **Simplify `.env` file:**
    *   Remove any environment variables that were specific to the multi-agent setup or the relay server.
    *   Ensure essential variables like `TELEGRAM_BOT_TOKEN`, `OPENAI_API_KEY` (or other LLM provider keys), and any necessary database/cache configs are present and correctly set for "ængel".

5.  **Update `pnpm-workspace.yaml` (if applicable):**
    *   If packages related to the removed features were part of a pnpm workspace, remove them from the `pnpm-workspace.yaml` file.

## III. Dependency Management and Build:

1.  **Uninstall Removed Dependencies:**
    *   Use `pnpm remove <package-name>` for each dependency identified in Step I.1. If they are workspace packages, navigate to the correct workspace directory or use `pnpm -F @scope/package remove ...`.
    *   Consider removing them from the root `package.json` as well if they were hoisted or directly listed there.

2.  **Clean and Reinstall Dependencies:**
    *   Run `pnpm install --no-frozen-lockfile` (or `pnpm install`) to update the lockfile and ensure a clean state.

3.  **Rebuild the Project:**
    *   Run `pnpm build` (likely within the `/root/eliza` directory, or specifically for the `agent` package if that's how the build is structured).
    *   Address any build errors that arise due to the removed code or dependencies. This might involve fixing import paths or type errors.

## IV. Testing:

1.  **Basic Startup Test:**
    *   Attempt to start the agent using the simplified startup script, ensuring it loads "ængel" and initializes the Telegram client without errors.
    *   Check logs for any remnants of multi-agent or relay server logic attempting to run.

2.  **Telegram Client Test:**
    *   Send a message to the Telegram bot associated with the `TELEGRAM_BOT_TOKEN`.
    *   Verify that "ængel" responds according to its defined personality and system prompts.
    *   Test a few interactions to ensure the LLM integration is working correctly through Telegram.

3.  **Error Handling:**
    *   Check that errors (e.g., LLM API issues, Telegram client issues) are gracefully handled and logged appropriately for a single-agent context.

## V. Cleanup:

1.  **Remove Unused Character Files:**
    *   Once `aengel.json` is confirmed working and is in the primary `eliza/characters/` directory, delete other character files (like `bag-flipper.json` unless it's being kept for a specific, non-conflicting reason) and the redundant copies of `aengel.json` from other locations (e.g., `agent/src/characters/`).
2.  **Review for Leftover Files:**
    *   Do a final pass for any other files or configurations that were missed.
3.  **Commit Changes:**
    *   Commit the streamlined version of the project to the local Git repository.

This plan provides a comprehensive approach. We will proceed step-by-step, and some steps might require further refinement based on the actual codebase structure of `aeternalsv2`. 