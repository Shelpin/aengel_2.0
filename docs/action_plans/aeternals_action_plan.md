# Aeternals Telegram Multi-Agent System - Action Plan

## Current Issues Diagnosis

Through analysis of logs and code, we have identified the following issues that are preventing proper functionality of the Telegram Multi-Agent system:

### 1. Runtime Initialization Issue

**Problem:** While `globalThis.__elizaRuntime` is being set correctly in the ElizaOS core runtime initialization, the object doesn't have the required methods like `getAgentId` and `getLogger` when the plugin tries to access them.

Evidence from logs:
```
[RUNTIME PATCH] Exposed runtime globally
[DEBUG] TelegramMultiAgentPlugin: globalThis.__elizaRuntime exists: true
[DEBUG] TelegramMultiAgentPlugin: globalThis.__elizaRuntime methods: getAgentId=false, getLogger=false
```

This indicates that the runtime is being exposed globally, but the methods aren't available yet when the plugin tries to access them.

**Analysis of ElizaOS Runtime Initialization:**

Looking at `packages/core/src/runtime.ts`, we can see that ElizaOS exposes the runtime globally early in the initialization process:

```typescript
async initialize() {
  // Expose runtime globally for custom plugin compatibility (TelegramMultiAgentPlugin)
  if (!globalThis.__elizaRuntime) {
    globalThis.__elizaRuntime = this;
    console.log("[RUNTIME PATCH] Exposed runtime globally");
  }
  
  this.initializeDatabase();

  // ... other initialization steps ...
  
  // Initialize plugins
  for (const plugin of this.plugins) {
    try {
      console.log(`Attempting to initialize plugin: ${plugin.name}`);
      if (plugin.initialize) {
        console.log(`Plugin ${plugin.name} has initialize method, calling it...`);
        await plugin.initialize();
        // ...
      }
    } catch (error) {
      // Error handling...
    }
  }
  
  // ... more initialization steps ...
}
```

The issue is that although the runtime is exposed globally very early, the plugin's `initialize()` method is called before all the runtime methods are fully setup. The plugin tries to access methods like `getAgentId` before they're available.

### 2. Relay Server Connection Issue

**Problem:** The relay server wasn't running consistently during startup, causing all agent-relay connections to fail.

Evidence:
- Manual curl test initially failing with connection refused
- No agent registrations shown in relay logs
- After manually starting the relay server, it functions correctly

**Relay Server Connection Process:**

1. The relay server should start during system initialization via `clean_restart.sh`.
2. The plugin then uses the `TelegramRelay` class to connect to the relay server.
3. The connection fails because:
   - The relay server may not have fully started before the connection attempt
   - The plugin itself is failing to initialize due to runtime access issues
   - The curl health check in the restart script may not be sufficient

### 3. Plugin Initialization Timing

**Problem:** The plugin's initialization happens before the ElizaOS runtime is fully ready.

Evidence from logs:
```
Plugin telegram-multiagent has initialize method, calling it...
[INIT] Plugin initialize() called
[telegram-multiagent] Plugin initialize() called
[telegram-multiagent] Runtime reference exists: false
```

This shows that the plugin's initialize method is being called too early in the ElizaOS startup sequence.

**Plugin Initialization Flow:**

1. ElizaOS loads plugins and calls their `initialize()` method during its own initialization process
2. Our plugin attempts to access runtime methods immediately
3. The plugin's `waitForRuntime()` method waits for 30 seconds for the runtime to be ready
4. The wait times out because the runtime methods are not yet available
5. The plugin continues with limited functionality, unable to register with the relay server

## Action Plan

### 1. Fix Runtime Access in Plugin

1. Modify the `waitForRuntime()` method in `PluginComponent.ts` to:
   - Use a more reliable detection mechanism
   - Add retry logic with exponential backoff
   - Detect not just the presence of `globalThis.__elizaRuntime` but when its methods are actually ready

```typescript
protected async waitForRuntime(timeoutMs: number = 60000): Promise<IAgentRuntime> {
  const start = Date.now();
  const maxDelay = 5000; // Max 5 seconds between attempts
  let delay = 100; // Start with 100ms delay

  this.logger.debug(`Waiting for runtime to be available (timeout: ${timeoutMs}ms)`);

  while (Date.now() - start < timeoutMs) {
    // Check this.runtime first
    if (this.runtime && typeof this.runtime.getAgentId === 'function') {
      this.logger.debug('Runtime found via this.runtime with required methods');
      return this.runtime;
    }

    // Check globalThis.__elizaRuntime
    if (globalThis.__elizaRuntime && 
        typeof globalThis.__elizaRuntime.getAgentId === 'function') {
      this.logger.debug('Runtime found via globalThis with required methods');
      this.runtime = globalThis.__elizaRuntime;
      return this.runtime;
    }

    // Log status every 5 seconds
    if ((Date.now() - start) % 5000 < delay) {
      const elapsed = Math.round((Date.now() - start) / 1000);
      
      if (globalThis.__elizaRuntime) {
        this.logger.debug(`Runtime exists but methods not ready. getAgentId=${typeof globalThis.__elizaRuntime.getAgentId === 'function'} (${elapsed}s elapsed)`);
      } else {
        this.logger.debug(`Runtime not available yet (${elapsed}s elapsed)`);
      }
    }

    // Wait with exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
    delay = Math.min(delay * 1.5, maxDelay); // Exponential backoff with cap
  }

  throw new Error(`Runtime not available after ${timeoutMs}ms`);
}
```

### 2. Fix Relay Server Startup

1. Modify `clean_restart.sh` to:
   - Use more robust verification that the relay server started
   - Wait longer for relay server to come online
   - Better error handling if relay fails to start

```bash
echo "🚀 Starting relay server..."
cd /root/eliza && ./relay-server/start-relay.sh > logs/relay-server.log 2>&1 &

# Wait up to 20 seconds for relay server to start
echo "🔄 Waiting for relay server to start..."
for i in {1..20}; do
  if curl -s http://localhost:4000/health | grep -q "status.*ok"; then
    echo "✅ Relay server is running correctly"
    break
  elif [ $i -eq 20 ]; then
    echo "❌ Relay server failed to start after 20 seconds. Check logs/relay-server.log"
    exit 1
  else
    echo "⏳ Waiting... ($i/20)"
    sleep 1
  fi
done
```

### 3. Implement Runtime Ready Signal

1. Modify `packages/core/src/runtime.ts` to signal when the runtime is fully ready:

```typescript
async initialize() {
  // Expose runtime globally for custom plugin compatibility (TelegramMultiAgentPlugin)
  if (!globalThis.__elizaRuntime) {
    globalThis.__elizaRuntime = this;
    console.log("[RUNTIME PATCH] Exposed runtime globally");
  }
  
  // ... existing initialization code ...

  // After all initialization is complete
  globalThis.__elizaRuntimeReady = true;
  console.log("[RUNTIME PATCH] Runtime fully initialized and ready");
}
```

2. Update `PluginComponent.ts` to check for this signal:

```typescript
if (globalThis.__elizaRuntime && globalThis.__elizaRuntimeReady) {
  this.logger.debug('Runtime found and ready via globalThis');
  this.runtime = globalThis.__elizaRuntime;
  return this.runtime;
}
```

### 4. Implement Safer Plugin Register Method

1. Modify `TelegramMultiAgentPlugin.ts` register method:

```typescript
register(runtime: IAgentRuntime): Plugin | boolean {
  try {
    console.log(`[REGISTER] ${this.name}: Register method called`);
    
    // Store runtime reference even if null
    super.setRuntime(runtime);
    
    if (!runtime) {
      console.warn(`[REGISTER] ${this.name}: Received null runtime, will attempt to obtain later`);
      return this;
    }
    
    // Store agentId immediately if available
    try {
      if (typeof runtime.getAgentId === 'function') {
        this.agentId = runtime.getAgentId();
        console.log(`[REGISTER] ${this.name}: Got agent ID during registration: ${this.agentId}`);
      }
    } catch (error) {
      console.warn(`[REGISTER] ${this.name}: Could not get agent ID during registration: ${error.message}`);
    }
    
    return this;
  } catch (error) {
    console.error(`[ERROR] ${this.name}: Unexpected error during plugin registration: ${error}`);
    return false;
  }
}
```

### 5. Testing Plan

1. After implementing these changes:
   - Rebuild the plugin: `cd /root/eliza && pnpm build -- --filter=@elizaos/telegram-multiagent`
   - Run clean restart: `./clean_restart.sh`
   - Monitor logs: `tail -f logs/relay_server.log`
   - Look for successful agent registrations

2. Test message sending:
   - Send a test message to the group
   - Check if agents respond
   - Verify inter-agent communication

## Monitoring and Verification

### Log Monitoring Plan

When testing the solution, monitor the following logs to confirm successful operation:

1. **Core ElizaOS Runtime Logs:**
   ```bash
   tail -f logs/vc_shark_99.log | grep -E "RUNTIME|initialize|plugin|telegram-multiagent|globalThis|ready"
   ```
   Look for:
   - "[RUNTIME PATCH] Exposed runtime globally"
   - "[RUNTIME PATCH] Runtime fully initialized and ready"
   - "Plugin telegram-multiagent has initialize method, calling it..."
   - "Runtime found via globalThis with required methods"

2. **Relay Server Logs:**
   ```bash
   tail -f logs/relay_server.log
   ```
   Look for:
   - "Agent registered: [agent_id]"
   - "Total connected agents: [number]"
   - Message handling between agents

3. **Plugin-specific Logs:**
   ```bash
   tail -f logs/vc_shark_99.log | grep -E "TelegramMultiAgentPlugin|relay|waitForRuntime"
   ```
   Look for:
   - "Runtime found via globalThis with required methods"
   - "[RELAY] Connected to relay server successfully"
   - "Registered agent with relay server"

### Success Criteria

The solution will be considered successful when:

1. All agents successfully register with the relay server
   - Verification: `✅ Agent registered: [agent_id]` in relay server logs
   - Expected count: 6 agents registered

2. The plugin properly initializes with access to the runtime
   - Verification: No timeout errors in `waitForRuntime()`
   - Success log: "Runtime found via globalThis with required methods"

3. Agents can respond to messages in Telegram
   - Send a test message to the group
   - Verify an agent responds appropriately

4. Agents can detect and respond to other agents' messages
   - Monitor a conversation between multiple agents
   - Verify they respond to each other's messages

## Alignment with ElizaOS Plugin Best Practices

The proposed solutions align with ElizaOS plugin system best practices in the following ways:

### 1. Plugin Lifecycle Management

Our approach properly respects the ElizaOS plugin lifecycle:
- **Registration Phase**: Storing the runtime reference but not attempting to use it immediately
- **Initialization Phase**: Waiting for the runtime to be fully ready before using its methods
- **Operational Phase**: Using runtime methods only after confirming they're available
- **Shutdown Phase**: Properly cleaning up resources during shutdown

### 2. Runtime Access Patterns

The improved approach follows best practices for accessing the ElizaOS runtime:
- **Defensive Coding**: Always checking if methods exist before calling them
- **Graceful Degradation**: Continuing with limited functionality when runtime isn't available
- **Clear Logging**: Adding detailed logs to aid debugging
- **Resilient Operation**: Using exponential backoff for retry attempts

### 3. Plugin Component Architecture

The changes maintain a clean component architecture:
- **Base Class Pattern**: Using a common `PluginComponent` base class for consistent behavior
- **Dependency Injection**: Properly passing the runtime to components
- **Service Registration**: Components register with the runtime when available
- **Separation of Concerns**: Each component has a single responsibility

### 4. Integration with ElizaOS Events System

The improved plugin will integrate better with ElizaOS's event system:
- **Event Handling**: Responding to ElizaOS lifecycle events
- **Asynchronous Operation**: Using promises and async/await for non-blocking operation
- **Error Boundaries**: Containing errors within component boundaries

### 5. Future Compatibility

The solution is designed to work with both current and future versions of ElizaOS:
- **Forward Compatible**: Using feature detection rather than version checking
- **Minimal Core Changes**: Only adding a small runtime readiness signal
- **Clean Extension Points**: Using standard plugin extension patterns
- **Configuration-Driven**: Using configuration files over hardcoded values

## Priority of Changes

1. Fix Runtime Access in Plugin (High Priority)
2. Fix Relay Server Startup (High Priority)
3. Implement Runtime Ready Signal (Medium Priority)
4. Implement Safer Plugin Register Method (Medium Priority)

## Expected Outcome

After implementing these changes, we expect:

1. All agents will successfully connect to the relay server
2. The plugin will properly initialize with the ElizaOS runtime
3. Agents will respond to messages in the Telegram group
4. Agents will be able to interact with each other
5. The entire system will be more robust and less prone to initialization errors 