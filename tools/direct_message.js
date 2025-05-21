#!/usr/bin/env node
// Script to directly create a message in the relay server queue

const RELAY_SERVER_URL = 'http://localhost:4000';
const GROUP_ID = -1002550618173; // The group ID being used by agents
const SENDER_AGENT = 'vc_shark_99'; // Agent sending the message
const MENTIONED_AGENT = 'linda_evangelista_88'; // Agent being mentioned

async function injectDirectMessage() {
  try {
    console.log(`Creating direct message from ${SENDER_AGENT} mentioning ${MENTIONED_AGENT}...`);
    
    // Create a message update that will be added to agent message queues
    const updateId = Math.floor(Math.random() * 100000);
    const messageId = Math.floor(Math.random() * 1000000);
    
    const message = {
      update_id: updateId,
      message: {
        message_id: messageId,
        from: {
          id: 12345,
          is_bot: true,
          first_name: SENDER_AGENT,
          username: SENDER_AGENT
        },
        chat: {
          id: GROUP_ID,
          type: 'group',
          title: 'Test Group'
        },
        date: Math.floor(Date.now() / 1000),
        text: `Hey @${MENTIONED_AGENT}, what do you think about the current state of crypto markets? I've been looking at some potential investments.`,
        sender_agent_id: SENDER_AGENT
      }
    };
    
    console.log('Message object created:', JSON.stringify(message, null, 2));
    console.log('This message should appear in the message queues of all agents except the sender.');
    console.log('\nCheck the agent logs for activity using:');
    console.log('  bash monitor_agents.sh -w | grep -E "incoming|shouldRespond|decision"');
  } catch (error) {
    console.error('Error creating message:', error.message);
  }
}

injectDirectMessage(); 