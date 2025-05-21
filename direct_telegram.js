#!/usr/bin/env node
// Script to send a direct message via Telegram API

// The GROUP_ID is the actual Telegram group ID the bots are monitoring
const GROUP_ID = -1002550618173;
const MENTIONED_AGENT = 'linda_evangelista_88';
// Correct Telegram bot username format (with _bot suffix)
const TELEGRAM_BOT_USERNAME = 'LindAEvangelista88_bot';

// We'll use one bot to send a message tagging another bot
// This will simulate a bot-to-bot interaction that others will see
const SENDER_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_VCShark99;

async function sendDirectTelegramMessage() {
  try {
    if (!SENDER_BOT_TOKEN) {
      console.error('Error: Bot token not found. Make sure the environment variable is set.');
      return;
    }

    console.log(`Sending direct Telegram message to group ${GROUP_ID} mentioning ${TELEGRAM_BOT_USERNAME}...`);
    
    // Create the message with proper Telegram username format
    const text = `Hey @${TELEGRAM_BOT_USERNAME}, what do you think about the current state of crypto markets? I've been looking at some potential investments.`;
    
    // Prepare the API URL with the bot token and method
    const apiUrl = `https://api.telegram.org/bot${SENDER_BOT_TOKEN}/sendMessage`;
    
    // API request parameters
    const params = {
      chat_id: GROUP_ID,
      text: text
    };
    
    // Send the message to Telegram API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    const responseData = await response.json();
    
    if (responseData.ok) {
      console.log('✅ Message sent successfully to Telegram!');
      console.log('Message ID:', responseData.result.message_id);
      console.log(`This should appear in the Telegram group and trigger a response from ${MENTIONED_AGENT}`);
    } else {
      console.error('❌ Failed to send message to Telegram:', responseData.description);
    }
    
    console.log('\nCheck the agent logs for activity using:');
    console.log('  bash monitor_agents.sh -w | grep -E "incoming|shouldRespond|decision"');
  } catch (error) {
    console.error('Error sending message:', error.message);
  }
}

sendDirectTelegramMessage(); 