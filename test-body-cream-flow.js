/**
 * Test the complete flow when user selects "Body Cream"
 */

const http = require('http');

// Simulate clicking "Body" then "Body Cream"
async function testFlow() {
  console.log('🧪 Testing Body Cream Selection Flow\n');

  // Step 1: Get greeting
  console.log('1️⃣  Getting greeting...');
  const greetingResponse = await fetch('http://localhost:5001/api/greeting?language=en&sessionId=test-session-123');
  const greeting = await greetingResponse.json();
  console.log('   ✓ Session ID:', greeting.sessionId);
  console.log('   ✓ Categories:', greeting.categories.map(c => c.label).join(', '));
  console.log('');

  // Step 2: Select "Body" category
  console.log('2️⃣  Selecting "Body" category...');
  const bodyResponse = await fetch('http://localhost:5001/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Body',
      sessionId: greeting.sessionId,
      userProfile: { language: 'en' }
    })
  });

  console.log('   Reading stream...');
  const bodyReader = bodyResponse.body.getReader();
  const bodyDecoder = new TextDecoder();
  let bodyBuffer = '';
  let bodyMessage = '';
  let subcategories = null;

  while (true) {
    const { done, value } = await bodyReader.read();
    if (done) break;

    bodyBuffer += bodyDecoder.decode(value, { stream: true });
    const lines = bodyBuffer.split('\n');
    bodyBuffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.substring(6));
        if (data.chunk) bodyMessage += data.chunk;
        if (data.showSubcategories) {
          subcategories = data.subcategories;
        }
      }
    }
  }

  console.log('   ✓ Message:', bodyMessage.substring(0, 100) + '...');
  console.log('   ✓ Subcategories:', subcategories ? subcategories.map(s => s.label).join(', ') : 'NONE');
  console.log('');

  if (!subcategories) {
    console.error('   ❌ ERROR: No subcategories received!');
    return;
  }

  // Step 3: Select "Body Cream" subcategory
  console.log('3️⃣  Selecting "Body Cream" subcategory...');
  const creamResponse = await fetch('http://localhost:5001/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Body Cream',
      sessionId: greeting.sessionId,
      userProfile: { language: 'en' }
    })
  });

  console.log('   Reading stream...');
  const creamReader = creamResponse.body.getReader();
  const creamDecoder = new TextDecoder();
  let creamBuffer = '';
  let creamMessage = '';
  let products = null;

  while (true) {
    const { done, value } = await creamReader.read();
    if (done) break;

    creamBuffer += creamDecoder.decode(value, { stream: true });
    const lines = creamBuffer.split('\n');
    creamBuffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.substring(6));
        if (data.content) {
          creamMessage += data.content;
          process.stdout.write(data.content);
        }
        // Capture product data
        if (data.showProducts && data.products) {
          products = data.products;
        }
      }
    }
  }

  console.log('\n');
  console.log('   ✓ Full response length:', creamMessage.length, 'characters');
  console.log('');

  // Check if products were sent as structured data
  console.log('4️⃣  Analyzing response...');

  if (products && products.length > 0) {
    console.log('   ✅ Products sent as STRUCTURED DATA (NEW FORMAT)');
    console.log('   ✅ Number of products:', products.length);
    console.log('');
    console.log('📦 Product Cards Data:');
    console.log('─'.repeat(80));

    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   💰 Price: LE ${product.price} | 📏 Size: ${product.size}`);
      console.log(`   📝 Description: ${product.description.substring(0, 80)}...`);
      console.log(`   ✨ Benefits: ${product.benefits ? product.benefits.length + ' benefits' : 'none'}`);
      console.log(`   🏷️  Category: ${product.category} / ${product.type}`);
    });

    console.log('\n' + '─'.repeat(80));
    console.log('\n✅ SUCCESS: Product cards data sent correctly!');
    console.log('🎨 The frontend widget will render these as beautiful cards with:');
    console.log('   • Product image placeholder');
    console.log('   • Name, price, and size');
    console.log('   • Description');
    console.log('   • Benefits list');
    console.log('   • Rating stars');
    console.log('   • WhatsApp order button');
  } else {
    console.log('   ❌ No structured product data received');
    console.log('\nText response:');
    console.log('─'.repeat(80));
    console.log(creamMessage);
    console.log('─'.repeat(80));
  }
}

testFlow().catch(console.error);
