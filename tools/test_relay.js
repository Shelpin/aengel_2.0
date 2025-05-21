const axios = require('axios');

async function sendTestMessage() {
  try {
    console.log('Sending test message to relay server...');
    
    const response = await axios.post('http://localhost:4000/update', {
      bot_username: 'bag_flipper_9000_bot',
      message: {
        message_id: Date.now(),
        from: {
          id: 12345,
          username: 'test_user',
          first_name: 'Test',
          is_bot: false
        },
        chat: {
          id: -1002550618173,
          type: 'group',
          title: 'Test Group'
        },
        text: 'Hello @bag_flipper_9000_bot, this is a test message',
        date: Math.floor(Date.now() / 1000)
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    console.log('Test message sent successfully!');
  } catch (err) {
    console.error('Error sending test message:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
  }
}

sendTestMessage(); 