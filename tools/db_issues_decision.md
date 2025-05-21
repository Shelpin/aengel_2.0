

Title: Database Strategy Guidance and Refactoring Map for ElizaOS Multi-Agent Plugin

⸻

🔐 Summary

You’ve reached a critical point in stabilizing the infrastructure: laying a solid, consistent, and future-proof SQLite database strategy for ElizaOS’s multi-agent plugin. Current implementation has legacy attempts, fallback mechanisms, and multiple SQLite libraries mixed with proxy layers, leading to fragmentation and potential data conflict or non-persistence.

This document provides:
	•	Feedback on the current database strategy.
	•	A map and clear refactor plan.
	•	Warnings, integration tips, and alignment goals for clean multi-agent memory coordination.

⸻

🔹 Current State: Findings and Warnings

❌ Key Issues Identified:
	•	Multiple SQLite Adapters in Use: sqlite3, better-sqlite3, sqlite, and @elizaos/adapter-sqlite used interchangeably.
	•	Overlapping Memory Layers: FallbackMemoryManager.ts, SqliteAdapterProxy.ts, and TelegramCoordinationAdapter.ts all provide memory interfaces.
	•	Multiple Schema Definitions: One in FallbackMemoryManager, another in schema.ts.
	•	Multiple .db files per agent (e.g., telegram-multiagent.db, multiagent.db, possibly others). This defeats shared memory and makes coordination nearly impossible.

❓ What Seems More Robust
	•	TelegramCoordinationAdapter.ts using schema.ts is the most complete and advanced DB coordination solution.
	•	SqliteAdapterProxy.ts is a powerful, circuit-breaker-backed direct DB interface.
	•	The plugin should converge around these two as the canonical DB interface and schema.

⸻

📘 DB Strategy Proposal (Recommended Direction)

✅ Adopt a Single Shared DB File:
	•	Default: data/telegram-multiagent.db
	•	One DB for all agents to coordinate through shared tables like:
	•	conversation_topics
	•	agent_conversation_participants
	•	agent_message_history

✅ Consolidate on:
	•	Schema: schema.ts
	•	Adapter: SqliteAdapterProxy.ts
	•	Coordinator/Manager: TelegramCoordinationAdapter.ts

⚠️ Deprecate or remove:
	•	FallbackMemoryManager.ts
	•	MemoryManager logic in ConversationManager.ts

If fallback is needed (e.g., test env), keep a minimal in-memory adapter that mimics SqliteAdapterProxy’s interface.

⸻

🔀 Action Map

Phase 0: Cleanup & Diagnostics
	•	Run a full-text search across the plugin for .db, DATABASE_PATH, sqlite3, better-sqlite3 and audit usage.
	•	Identify and remove any agent-specific DB path code.
	•	Ensure DATABASE_PATH points to a unified telegram-multiagent.db.

Phase 1: Refactor for Single Source of Truth
	•	Remove redundant schema creation from FallbackMemoryManager.ts.
	•	Replace any memoryManager.getMemories() with equivalent TelegramCoordinationAdapter queries.
	•	Refactor ConversationManager to use injected TelegramCoordinationAdapter instead of memory fallback.

Phase 2: Validation & Testing
	•	Create Jest tests to simulate two agents writing to/reading from the same DB file.
	•	Confirm table-level consistency under concurrent writes (e.g., agents responding simultaneously).
	•	Ensure agent_conversation_participants updates as expected.

⸻

⚡ Tips & Hints
	•	Add debug logging on DB access layer (via Proxy or Adapter).
	•	Confirm schema migrations don’t overwrite existing data.
	•	Avoid writing per-agent memory state into their own file.
	•	Watch for usage of fallback memory paths when no DB path is defined (e.g., .env misread or USE_IN_MEMORY_DB set).
	•	Validate that DATABASE_PATH resolves correctly (no agent-specific override).
	•	Scan for deprecated or lingering imports/initializations of FallbackMemoryManager.
	•	Use TelegramCoordinationAdapter in TelegramMultiAgentPlugin directly or via a thin service injected at startup.
	•	Validate DB health on agent startup: table existence, connectivity, and file accessibility.

⸻

🧩 Final Word

You’re on the right path, but DB cleanup and alignment is essential. Without this, coordination and state across agents will remain fragile.

Locking in a clean and unified database foundation will prevent loop errors, loss of memory, or agent desync—the ox will be well-roasted, not burnt.

Happy hacking – and shout if you need concrete code prompts for the next refactor steps!

⸻

🧭 Role of Key Components

schema.ts

Defines and centralizes the canonical structure of all DB tables related to coordination. Ensures consistency and should be the only definition referenced.

SqliteAdapterProxy.ts

Acts as a robust, optionally circuit-breaker-guarded, low-level DB interface. It’s flexible and ideal for reuse across various plugins without tight coupling.

TelegramCoordinationAdapter.ts

Wraps the Proxy for Telegram-specific coordination logic. Ideal location for inserting getConversations, getLastSpeaker, recordMessage, and similar logic across agents.

⸻
