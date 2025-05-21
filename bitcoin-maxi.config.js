require('dotenv').config({ path: '/root/eliza/.env' });

module.exports = {
  apps: [{
    name: 'bitcoin-maxi',
    script: 'pnpm',
    args: '--filter "@elizaos/agent" start --isRoot --characters="characters/bitcoin_maxi_420.json" --clients=@elizaos-plugins/client-telegram --update-env --log-level=error',
    env: {
      NODE_ENV: 'production',
      TELEGRAM_BOT_TOKEN_BitcoinMaxi420: process.env.TELEGRAM_BOT_TOKEN_BitcoinMaxi420
    }
  }]
}
