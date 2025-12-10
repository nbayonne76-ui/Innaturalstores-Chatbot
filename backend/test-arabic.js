// Test script for Arabic queries
const axios = require('axios');

const testQueries = [
  { query: 'عندي تساقط شعر', expected: 'HAIR_LOSS' },
  { query: 'شعري جاف', expected: 'DRY_HAIR' },
  { query: 'عندي هيشان', expected: 'SPLIT_ENDS_FRIZZ' },
  { query: 'شعري مصبوغ', expected: 'COLORED_HAIR' },
  { query: 'انا حامل', expected: 'PREGNANCY_SAFE' },
];

async function testQuery(query, expected) {
  console.log(`\n🧪 Testing: "${query}"`);
  console.log(`   Expected scenario: ${expected}`);

  try {
    const response = await axios.post('http://localhost:5000/api/chat', {
      message: query,
      sessionId: `test_${Date.now()}`
    });

    if (response.data.success) {
      console.log(`   ✅ Response received (${response.data.message.substring(0, 50)}...)`);
      console.log(`   Language: ${response.data.language}`);
    } else {
      console.log(`   ❌ Failed: ${response.data.error || response.data.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Arabic query tests...\n');
  console.log('================================================');

  for (const test of testQueries) {
    await testQuery(test.query, test.expected);
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n================================================');
  console.log('✅ Tests completed!\n');
}

runTests();
