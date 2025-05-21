# 🚀 æternals: Autonomous Telegram Bot Network

![Powered by Aeternity Foundation](https://img.shields.io/badge/Powered%20by-Aeternity%20Foundation-blue)

> 🌟 **This project is proudly supported by the [Aeternity Foundation](https://aeternity.foundation/)** - Advancing decentralized communication technologies through innovative AI solutions.

A ground-breaking system that enables multiple AI bots to see and communicate with each other in Telegram groups, overcoming the fundamental Telegram API limitation where bots cannot see other bots' messages.

![Bot Communication](https://img.shields.io/badge/Bot--to--Bot-Communication-purple)
![Agent Management System](https://img.shields.io/badge/Agent%20Management-System-blue)
![Security Enhanced](https://img.shields.io/badge/Security-Enhanced-green)
![Real-time Monitoring](https://img.shields.io/badge/Monitoring-Real--time-orange)

## 📚 System Overview

Aeternals enables an autonomous network of AI bots that interact with each other and humans in Telegram groups. Our system uses a relay server architecture to bypass Telegram's API limitations, providing:

- **See each other's messages**: Bots can process and respond to other bots' messages
- **Make independent decisions**: Each bot autonomously decides whether to ignore or respond
- **Support managed turn-taking**: Prevents overlapping responses with FIFO or round-robin strategies
- **Maintain shared context**: Uses in-memory state for real-time tracking and SQLite for persistence
- **Express distinct personalities**: Unique tone, emoji, and stylistic traits via PersonalityEnhancer
- **Simulate realistic interactions**: Typing indicators and variable response delays for natural pacing

Built on ElizaOS, Aeternals provides complete agent lifecycle management:

- **Starting Agents**: Secure launching with consistent port assignment
- **Stopping Agents**: Clean termination with proper resource cleanup
- **Monitoring**: Real-time activity tracking and health checks
- **Security**: Enhanced protection for tokens and system resources

## 📋 Key Achievements

- ✅ **Bot-to-Bot Visibility**: Successfully implemented relay server enabling bots to see and process each other's messages
- ✅ **Decision Logic**: Bots can analyze other bots' messages and make IGNORE/RESPOND decisions
- ✅ **Hybrid Memory Model**: Uses runtime memory manager with SQLite persistence and in-memory fallback via ConversationManager
- ✅ **Relay Server Communication**: Achieved stable heartbeat connections from all agents to relay server
- ✅ **Valhalla Runtime Integration**: Successfully patched and integrated with ElizaOS core framework
- ✅ **Flexible Configuration**: Environment variable support for group IDs and secure configuration
- ✅ **Character Personalization**: Six unique bot personalities with distinct behaviors via PersonalityEnhancer
- ✅ **Runtime Patching System**: Implemented robust patching mechanism for runtime enhancements
- ✅ **Direct Telegram API Integration**: Bots can respond directly to each other through the Telegram API
- ✅ **Conversation Lifecycle Management & Turn-Taking**: Basic conversation state management and FIFO/round-robin turn-taking via ConversationManager
- ✅ **Personality Integration**: Integrated PersonalityEnhancer for message styling, emoji, and response timing

## 📋 Core Components

The Aeternals system consists of these essential parts:

1. **Relay Server** - Central communication hub enabling cross-bot message visibility
2. **TelegramMultiAgentPlugin** - Orchestrates message routing, conversation coordination, and ElizaOS integration
3. **ConversationManager** - Manages conversation IDs, state storage, participant tracking, and turn-taking
4. **PersonalityEnhancer** - Applies personality-driven styling, emojis, and response timing to messages
5. **TypingSimulator** - Simulates typing indicators and calculates realistic delays before sending
6. **Memory Management System** - Hybrid in-memory and SQLite persistence for conversations and history
7. **Character System** - Defines and loads unique agent personalities and traits
8. **start-agents.sh & stop_agents.sh** - Scripts for launching and terminating agents with secure environment handling
9. **Monitor and Health Checks** - Real-time system monitoring and health endpoints

## 🔧 Technical Features

### Hybrid Memory Management System (New)

- **Reliability Focus**: In-memory state for speed with SQLite persistence for durability
- **Runtime Patching**: Dynamically injects and configures memory adapter at runtime
- **Configurable**: In-memory retention policies and SQLite data storage paths
- **Optimized Performance**: Reduced overhead for real-time responses
- **Environment Flag**: `USE_IN_MEMORY_DB` toggles hybrid memory mode

### Conversation Management System (New)

- **Conversation Lifecycle Tracking**: Creates and tracks conversation IDs, participants, topics, and statuses
- **Turn-Taking Strategies**: FIFO, round-robin, and configurable strategies to control response order
- **Conflict Avoidance**: Prevents multiple agents from speaking simultaneously and enforces cooldowns
- **Conversation Persistence**: Stores state changes and messages in SQLite for recovery and long-term context
- **Personality-Driven Behaviors**: Collaborates with PersonalityEnhancer for context-aware, trait-based responses
- **Typing Simulation**: Integrates with TypingSimulator to enhance natural pacing

### Start System (`start-agents.sh`)

- **Session Isolation**: Uses `setsid` to create independent process groups
- **Consistent Port Assignment**: Three-tier port allocation system
  - Reuses previous port assignments when available
  - Falls back to position-based port allocation (agent's position in array + starting port)
  - Dynamically finds available ports if needed
- **Token Security**: Masks sensitive tokens and properly handles environment variables
- **Process Management**: Better PID tracking with proper child process handling
- **Permissions Management**: Applies secure file permissions
- **Environment Variable Support**: Configures group IDs through `TELEGRAM_GROUP_IDS` environment variable

### Stop System (`stop_agents.sh`)

- **Process Tree Termination**: Properly terminates all child processes
- **Graceful Shutdown**: Attempts clean shutdown before force killing
- **Resource Cleanup**: Removes port files and PID files
- **Port Cleanup Mode**: Special mode to free all used ports
- **Enhanced Security**: Input validation and secure command execution

### Monitoring System (`monitor_agents.sh`)

- **Real-time Log Display**: View activity across all agents simultaneously
- **Agent Status Checks**: Comprehensive health monitoring
- **Port Usage Verification**: Multi-method port detection
- **Security Auditing**: Permissions and exposure checks
- **Resource Usage Statistics**: Memory, CPU, and runtime tracking

### Relay Server System

- **Bot-to-Bot Communication**: Successfully enables bots to see and process each other's messages
- **Bypass Telegram Limitations**: Overcomes API limitation where bots cannot see other bots' messages
- **Agent Registration**: Automatic registration of agents with the relay server
- **Message Routing**: Intelligently routes messages to appropriate agents
- **Heartbeat Mechanism**: Maintains active connections with periodic checks
- **Decision Processing**: Allows bots to make IGNORE/RESPOND decisions on other bots' messages
- **Health Endpoint**: Provides real-time status of all connected agents

## 🔒 Security Features

The management system includes extensive security enhancements:

- **Secure Process Isolation**: Prevents signal propagation between processes
- **Input Validation**: Prevents command injection and script exploitation
- **Token Protection**: Masks sensitive information and secures environment variables
- **Permission Management**: Applies and verifies proper file permissions
- **Audit Capabilities**: Security scanning for potential vulnerabilities
- **Process Verification**: Ensures processes are properly running and using expected resources
- **Environment Variable Security**: Properly handles sensitive configuration through environment variables

## 📊 Monitoring Capabilities

The monitoring system provides comprehensive visibility:

- **Real-time Activity**: View incoming/outgoing messages as they happen
- **Agent Health**: Check uptime, resource usage, and connectivity
- **Port Management**: Verify port assignments and detect conflicts
- **Log Analysis**: Filter logs by activity type or errors
- **Resource Tracking**: Monitor memory usage, CPU, and runtime statistics
- **Bot Communication**: Verify successful message relay between bots
- **Relay Server Health**: Monitor agent registration and heartbeat status

## 📈 Resource Management

The system optimizes resource usage:

- **Process Tracking**: Properly manages PID files and process trees
- **Port Management**: Ensures consistent port assignment
- **Memory Usage**: Tracks and reports memory consumption
- **CPU Utilization**: Monitors agent CPU usage
- **State Preservation**: Maintains consistent state across restarts
- **In-Memory Mode**: Option to use memory-only mode for improved performance
- **SQLite Persistence**: Optional file-based SQLite storage

## 🚀 Current Status

**Operational Components**:
- ✅ Multi-process agent architecture with individual port and PID management
- ✅ Character-specific configurations for 6 unique agent personalities
- ✅ Relay Server for bot-to-bot communication (confirmed working)
- ✅ Message relay between agents (verified through logs)
- ✅ Message processing and decision making logic (confirmed functioning)
- ✅ Hybrid memory model active (runtime memory manager + SQLite fallback)
- ✅ Runtime patching system for dynamic enhancements
- ✅ Configuration from both environment variables and external files
- ✅ Direct Telegram API messaging for reliable bot-to-bot communication
- ✅ Conversation lifecycle management and turn-taking (ConversationManager)
- ✅ Personality-driven styling and response timing (PersonalityEnhancer)
- ✅ Typing simulation with realistic delays

**Partially Implemented Components**:
- ⏳ Autonomous conversation initiation (kickstarting framework)
- ⏳ Advanced topic steering and LLM-assisted transitions
- ⏳ Sophisticated conversation flow & follow-up generation
- ⏳ TypeScript build process (experimental loader)

**Known Issues**:

## �� Getting Started

1. Ensure you have the required dependencies:
   - Bash 4.0+
   - lsof (for port management)
   - Node.js 23+
   - pnpm
   - standard Unix tools

2. Set up your agent configuration in the scripts:
   - Define agents in the `AGENTS` array
   - Configure port ranges and directories

3. Make the scripts executable:
   ```bash
   chmod +x start_agents.sh stop_agents.sh monitor_agents.sh
   ```

4. Configure environment variables:
   ```bash
   # Add this to your .env file or environment
   export TELEGRAM_GROUP_IDS="-1001234567890,-1009876543210"
   ```

5. Start your agents with the patched system:
   ```bash
   # Start relay server
   cd /root/eliza/relay-server && PORT=4000 node server.js > /root/eliza/logs/relay-server.log 2>&1 &
   
   # Start agents with patches
   AGENT_ID=eth_memelord_9000 USE_IN_MEMORY_DB=true node patches/start-agent-with-patches.js --isRoot --characters=/root/eliza/packages/agent/src/characters/eth_memelord_9000.json --clients=@elizaos/client-telegram --plugins=@elizaos/telegram-multiagent --port=3000 --log-level=debug > /root/eliza/logs/eth_patches.log 2>&1 &
   ```

6. Monitor their status:
   ```bash
   # Check relay server health
   curl http://localhost:4000/health
   
   # Check agent logs
   tail -f /root/eliza/logs/eth_patches.log
   ```

## 🔍 Troubleshooting

| Problem | Solution |
|---------|----------|
| Agent fails to start | Check logs with `tail -f /root/eliza/logs/*_patches.log` |
| SQLite database errors | Set `USE_IN_MEMORY_DB=true` to use in-memory mode |
| Port conflicts | Run `./stop_agents.sh -p` to clean up ports or use `lsof -i :<port>` to find conflicts |
| Security warnings | Address issues found with `./monitor_agents.sh -S` |
| Agent unresponsive | Restart with `pkill -f "node patches/start-agent" && ./start-agents.sh` |
| Permission errors | Ensure proper permissions on log directories with `chmod 755 logs/` |
| Bots not seeing each other | Check relay server health with `curl http://localhost:4000/health` |
| Bot token issues | Ensure TELEGRAM_BOT_TOKEN_* variables are properly set for each agent |
| Valhalla runtime errors | Check patch status with `grep -n "PATCH" logs/*_patches.log` |
| ts-node loader errors | Use direct node execution with prebuilt JavaScript files |
| Character file not found | Use absolute path to character file: `/root/eliza/packages/agent/src/characters/eth_memelord_9000.json` |

---

# Based on ElizaOS 🤖

<div align="center">
  <img src="./docs/static/img/eliza_banner.jpg" alt="Eliza Banner" width="100%" />
</div>

<div align="center">

📑 [Technical Report](https://arxiv.org/pdf/2501.06781) |  📖 [Documentation](https://elizaos.github.io/eliza/) | 🎯 [Examples](https://github.com/thejoven/awesome-eliza)

</div>

## 📖 README Translations

[中文说明](i18n/readme/README_CN.md) | [日本語の説明](i18n/readme/README_JA.md) | [한국어 설명](i18n/readme/README_KOR.md) | [Persian](i18n/readme/README_FA.md) | [Français](i18n/readme/README_FR.md) | [Português](i18n/readme/README_PTBR.md) | [Türkçe](i18n/readme/README_TR.md) | [Русский](i18n/readme/README_RU.md) | [Español](i18n/readme/README_ES.md) | [Italiano](i18n/readme/README_IT.md) | [ไทย](i18n/readme/README_TH.md) | [Deutsch](i18n/readme/README_DE.md) | [Tiếng Việt](i18n/readme/README_VI.md) | [עִברִית](i18n/readme/README_HE.md) | [Tagalog](i18n/readme/README_TG.md) | [Polski](i18n/readme/README_PL.md) | [Arabic](i18n/readme/README_AR.md) | [Hungarian](i18n/readme/README_HU.md) | [Srpski](i18n/readme/README_RS.md) | [Română](i18n/readme/README_RO.md) | [Nederlands](i18n/readme/README_NL.md) | [Ελληνικά](i18n/readme/README_GR.md)

## 🚩 Overview

<div align="center">
  <img src="./docs/static/img/eliza_diagram.png" alt="Eliza Diagram" width="100%" />
</div>

## ✨ Features

- 🛠️ Full-featured Discord, X (Twitter) and Telegram connectors
- 🔗 Support for every model (Llama, Grok, OpenAI, Anthropic, Gemini, etc.)
- 👥 Multi-agent and room support
- 📚 Easily ingest and interact with your documents
- 💾 Retrievable memory and document store
- 🚀 Highly extensible - create your own actions and clients
- 📦 Just works!

## Video Tutorials

[AI Agent Dev School](https://www.youtube.com/watch?v=ArptLpQiKfI&list=PLx5pnFXdPTRzWla0RaOxALTSTnVq53fKL)

## 🎯 Use Cases

- 🤖 Chatbots
- 🕵️ Autonomous Agents
- 📈 Business Process Handling
- 🎮 Video Game NPCs
- 🧠 Trading

## 🚀 Quick Start

### Prerequisites

- [Python 2.7+](https://www.python.org/downloads/)
- [Node.js 23+](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [pnpm](https://pnpm.io/installation)

> **Note for Windows Users:** [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install-manual) is required.

### Use the Starter (Recommended for Agent Creation)

Full steps and documentation can be found in the [Eliza Starter Repository](https://github.com/elizaOS/eliza-starter).
```bash
git clone https://github.com/elizaos/eliza-starter.git
cd eliza-starter
cp .env.example .env
pnpm i && pnpm build && pnpm start
```

### Manually Start Eliza (Only recommended for plugin or platform development)

#### Checkout the latest release

```bash
# Clone the repository
git clone https://github.com/elizaos/eliza.git

# This project iterates fast, so we recommend checking out the latest release
git checkout $(git describe --tags --abbrev=0)
# If the above doesn't checkout the latest release, this should work:
# git checkout $(git describe --tags `git rev-list --tags --max-count=1`)
```

If you would like the sample character files too, then run this:
```bash
# Download characters submodule from the character repos
git submodule update --init
```

#### Edit the .env file

Copy .env.example to .env and fill in the appropriate values.

```
cp .env.example .env
```

Note: .env is optional. If you're planning to run multiple distinct agents, you can pass secrets through the character JSON

#### Start Eliza

```bash
pnpm i
pnpm build
pnpm start

# The project iterates fast, sometimes you need to clean the project if you are coming back to the project
pnpm clean
```

### Interact via Browser

Once the agent is running, you should see the message to run "pnpm start:client" at the end.

Open another terminal, move to the same directory, run the command below, then follow the URL to chat with your agent.

```bash
pnpm start:client
```

Then read the [Documentation](https://elizaos.github.io/eliza/) to learn how to customize your Eliza.

---

### Automatically Start Eliza

The start script provides an automated way to set up and run Eliza:

```bash
sh scripts/start.sh
```

For detailed instructions on using the start script, including character management and troubleshooting, see our [Start Script Guide](./docs/docs/guides/start-script.md).

> **Note**: The start script handles all dependencies, environment setup, and character management automatically.

---

### Modify Character

1. Open `packages/core/src/defaultCharacter.ts` to modify the default character. Uncomment and edit.

2. To load custom characters:
    - Use `pnpm start --characters="path/to/your/character.json"`
    - Multiple character files can be loaded simultaneously
3. Connect with X (Twitter)
    - change `"clients": []` to `"clients": ["twitter"]` in the character file to connect with X

---

### Add more plugins

1. run `npx elizaos plugins list` to get a list of available plugins or visit https://elizaos.github.io/registry/

2. run `npx elizaos plugins add @elizaos-plugins/plugin-NAME` to install the plugin into your instance

#### Additional Requirements

You may need to install Sharp. If you see an error when starting up, try installing it with the following command:

```
pnpm install --include=optional sharp
```

---

## Using Your Custom Plugins
Plugins that are not in the official registry for ElizaOS can be used as well. Here's how:

### Installation

1. Upload the custom plugin to the packages folder:

```
packages/
├─plugin-example/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts        # Main plugin entry
│   ├── actions/        # Custom actions
│   ├── providers/      # Data providers
│   ├── types.ts        # Type definitions
│   └── environment.ts  # Configuration
├── README.md
└── LICENSE
```

2. Add the custom plugin to your project's dependencies in the agent's package.json:

```json
{
  "dependencies": {
    "@elizaos/plugin-example": "workspace:*"
  }
}
```

3. Import the custom plugin to your agent's character.json

```json
  "plugins": [
    "@elizaos/plugin-example",
  ],
```

---

### Start Eliza with Gitpod

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/elizaos/eliza/tree/main)

---

### Deploy Eliza in one click

Use [Fleek](https://fleek.xyz/eliza/) to deploy Eliza in one click. This opens Eliza to non-developers and provides the following options to build your agent:
1. Start with a template
2. Build characterfile from scratch
3. Upload pre-made characterfile

Click [here](https://fleek.xyz/eliza/) to get started!

---

### Community & contact

- [GitHub Issues](https://github.com/elizaos/eliza/issues). Best for: bugs you encounter using Eliza, and feature proposals.
- [elizaOS Discord](https://discord.gg/elizaos). Best for: hanging out with the elizaOS technical community
- [DAO Discord](https://discord.gg/ai16z). Best for: hanging out with the larger non-technical community

## Citation

We now have a [paper](https://arxiv.org/pdf/2501.06781) you can cite for the Eliza OS:
```bibtex
@article{walters2025eliza,
  title={Eliza: A Web3 friendly AI Agent Operating System},
  author={Walters, Shaw and Gao, Sam and Nerd, Shakker and Da, Feng and Williams, Warren and Meng, Ting-Chien and Han, Hunter and He, Frank and Zhang, Allen and Wu, Ming and others},
  journal={arXiv preprint arXiv:2501.06781},
  year={2025}
}
```

## Contributors

<a href="https://github.com/elizaos/eliza/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=elizaos/eliza" alt="Eliza project contributors" />
</a>


## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=elizaos/eliza&type=Date)](https://star-history.com/#elizaos/eliza&Date)

## 🛠️ System Requirements

### Minimum Requirements
- CPU: Dual-core processor
- RAM: 4GB
- Storage: 1GB free space
- Internet connection: Broadband (1 Mbps+)

### Software Requirements
- Python 2.7+ (3.8+ recommended)
- Node.js 23+
- pnpm
- Git

### Optional Requirements
- GPU: For running local LLM models
- Additional storage: For document storage and memory
- Higher RAM: For running multiple agents

## 📁 Project Structure
```
eliza/
├── packages/
│   ├── core/           # Core Eliza functionality
│   ├── clients/        # Client implementations
│   └── actions/        # Custom actions
├── docs/              # Documentation
├── scripts/           # Utility scripts
└── examples/          # Example implementations
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started
1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

### Types of Contributions
- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🌍 Translations
- 🧪 Test improvements

### Code Style
- Follow the existing code style
- Add comments for complex logic
- Update documentation for changes
- Add tests for new features

## IDE Configuration

### VS Code
Use the provided `.vscode/settings.json`. TypeScript server will be configured automatically.

### JetBrains IDEs (WebStorm, IntelliJ)
Open tsconfig.ide.json as the project's TypeScript configuration.

### Other IDEs
Configure your TypeScript Language Server to:
- Use the workspace TypeScript version (5.6.3)
- Use non-relative imports
- Skip type checking in node_modules

## Build System

ElizaOS now features a standardized build system that enables clean, reproducible builds across all packages. To build the entire project:

```bash
./clean-build.sh
```

The build system follows these steps:
1. Checks for circular dependencies
2. Standardizes package configurations
3. Builds packages in dependency order
4. Verifies the built packages can be imported correctly

For more details on the build system, see [Build System Documentation](./scripts/build/README.md).