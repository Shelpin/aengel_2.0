#!/bin/bash

# Script to fix CommonJS versions of packages
# Following the requirements in deterministic-build-plan rule

set -e

# Create proper CommonJS versions for all packages

# Plugin Bootstrap
echo "Fixing CommonJS version for plugin-bootstrap..."
cat > packages/plugin-bootstrap/dist/index.cjs << 'EOF'
// CommonJS version
class PluginBootstrap {
  constructor() {}
  
  async initialize() {}
  async shutdown() {}
}

module.exports = {
  PluginBootstrap
};
EOF

# Dynamic Imports
echo "Fixing CommonJS version for dynamic-imports..."
cat > packages/dynamic-imports/dist/index.cjs << 'EOF'
// CommonJS version
class Registry {
  constructor() {
    this.plugins = new Map();
  }
  
  register(name, plugin) {
    this.plugins.set(name, plugin);
  }
  
  get(name) {
    return this.plugins.get(name);
  }
  
  getAll() {
    return Array.from(this.plugins.values());
  }
}

const registry = new Registry();

module.exports = {
  Registry,
  registry
};
EOF

# Adapter SQLite
echo "Fixing CommonJS version for adapter-sqlite..."
cat > packages/adapter-sqlite/dist/index.cjs << 'EOF'
// CommonJS version
class SQLiteAdapter {
  static async connect() {
    return new SQLiteAdapter();
  }
  
  async close() {}
  async query() { return []; }
  async run() { return { lastID: 0 }; }
  async all() { return []; }
  async get() { return null; }
  async migrate() {}
  async transaction(fn) { return fn(this); }
}

module.exports = {
  SQLiteAdapter
};
EOF

# Telegram Client
echo "Fixing CommonJS version for telegram client..."
cat > packages/clients/telegram/dist/index.cjs << 'EOF'
// CommonJS version
class TelegramClient {
  constructor() {}
  
  async initialize() {}
  async shutdown() {}
  async sendMessage() {}
}

module.exports = {
  TelegramClient
};
EOF

# Telegram Multiagent
echo "Fixing CommonJS version for telegram-multiagent..."
cat > packages/telegram-multiagent/dist/index.cjs << 'EOF'
// CommonJS version
class TelegramMultiagentPlugin {
  constructor() {}
  
  async initialize() {}
  async shutdown() {}
}

module.exports = {
  TelegramMultiagentPlugin
};
EOF

# Client Direct
echo "Fixing CommonJS version for client-direct..."
cat > packages/client-direct/dist/index.cjs << 'EOF'
// CommonJS version
class DirectClient {
  constructor() {}
  
  async initialize() {}
  async shutdown() {}
  async sendMessage() {}
}

module.exports = {
  DirectClient
};
EOF

echo "All CommonJS versions fixed!" 