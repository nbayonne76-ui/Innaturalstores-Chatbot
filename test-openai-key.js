const OpenAI = require('openai');
require('dotenv').config({ path: '.env' });

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAIKey() {
  console.log('🔍 Testing OpenAI API Key...\n');
  console.log('Key starts with:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'NOT FOUND');
  console.log('');

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 50,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello, API key is working!" in one sentence.' }
      ],
    });

    const response = completion.choices[0].message.content;
    console.log('✅ OpenAI API Key is WORKING!\n');
    console.log('Response:', response);
    console.log('\nModel used:', completion.model);
    console.log('Tokens used:', completion.usage.total_tokens);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ OpenAI API Key FAILED!\n');
    console.error('Error:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
    if (error.code) {
      console.error('Code:', error.code);
    }
    console.error('');
    process.exit(1);
  }
}

testOpenAIKey();
