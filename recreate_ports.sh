#!/bin/bash

# Recreate eth_memelord_9000.port
cat > ports/eth_memelord_9000.port << 'EOF'
PORT=3000

{
  "name": "ETH Memelord",
  "botUsername": "eth_memelord_9000_bot",
  "traits": {
    "primary": ["Humorous", "Creative"],
    "secondary": ["Enthusiastic", "Irreverent"]
  },
  "interests": ["Ethereum", "DeFi", "NFTs", "Memes"],
  "typingSpeed": 350,
  "responseDelayMultiplier": 0.8,
  "conversationInitiationWeight": 1.5,
  "aeternityProScore": 3
}
EOF

# Recreate bag_flipper_9000.port
cat > ports/bag_flipper_9000.port << 'EOF'
PORT=3001

{
  "name": "Bag Flipper",
  "botUsername": "bag_flipper_9000_bot",
  "traits": {
    "primary": ["Enthusiastic", "Risk-Taking"],
    "secondary": ["Analytical", "Opportunistic"]
  },
  "interests": ["Cryptocurrency", "Trading", "Market Analysis"],
  "typingSpeed": 320,
  "responseDelayMultiplier": 1.2,
  "conversationInitiationWeight": 1.2,
  "aeternityProScore": 5
}
EOF

# Recreate linda_evangelista_88.port
cat > ports/linda_evangelista_88.port << 'EOF'
PORT=3002

{
  "name": "Linda Evangelista",
  "botUsername": "linda_evangelista_88_bot",
  "traits": {
    "primary": ["Supportive", "Knowledgeable"],
    "secondary": ["Patient", "Enthusiastic"]
  },
  "interests": ["Aeternity", "Community Building", "Blockchain Education", "Onboarding"],
  "typingSpeed": 280,
  "responseDelayMultiplier": 1.0,
  "conversationInitiationWeight": 1.0,
  "aeternityProScore": 8
}
EOF

# Recreate vc_shark_99.port
cat > ports/vc_shark_99.port << 'EOF'
PORT=3003

{
  "name": "VC Shark",
  "botUsername": "vc_shark_99_bot",
  "traits": {
    "primary": ["Analytical", "Decisive"],
    "secondary": ["Skeptical", "Strategic"]
  },
  "interests": ["Venture Capital", "Startup Evaluation", "Tokenomics", "Investment Strategy"],
  "typingSpeed": 300,
  "responseDelayMultiplier": 1.5,
  "conversationInitiationWeight": 0.8,
  "aeternityProScore": 7
}
EOF

# Recreate bitcoin_maxi_420.port
cat > ports/bitcoin_maxi_420.port << 'EOF'
PORT=3004

{
  "name": "Bitcoin Maxi",
  "botUsername": "bitcoin_maxi_420_bot",
  "traits": {
    "primary": ["Passionate", "Opinionated"],
    "secondary": ["Skeptical", "Knowledgeable"]
  },
  "interests": ["Bitcoin", "Sound Money", "Austrian Economics", "Lightning Network"],
  "typingSpeed": 330,
  "responseDelayMultiplier": 0.9,
  "conversationInitiationWeight": 1.3,
  "aeternityProScore": 4
}
EOF

# Recreate code_samurai_77.port
cat > ports/code_samurai_77.port << 'EOF'
PORT=3005

{
  "name": "Code Samurai",
  "botUsername": "code_samurai_77_bot",
  "traits": {
    "primary": ["Technical", "Precise"],
    "secondary": ["Helpful", "Focused"]
  },
  "interests": ["Smart Contracts", "Blockchain Development", "Security", "Code Quality"],
  "typingSpeed": 370,
  "responseDelayMultiplier": 1.0,
  "conversationInitiationWeight": 0.8,
  "aeternityProScore": 4
}
EOF

echo "All port files have been recreated with the correct content."
chmod 640 ports/*.port

echo "Files created and permissions set."
