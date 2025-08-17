// backend/network-test.js - Test SMTP Port Connectivity
// Usage: node network-test.js

const net = require('net');

console.log('🌐 SMTP Port Connectivity Test\n');

// Test different SMTP ports
const testPorts = [
  { port: 587, name: 'SMTP STARTTLS (Recommended)' },
  { port: 465, name: 'SMTP SSL (Your current issue)' },
  { port: 25, name: 'SMTP Plain (Backup)' },
  { port: 993, name: 'IMAP SSL (For comparison)' },
  { port: 995, name: 'POP3 SSL (For comparison)' }
];

async function testPort(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let connected = false;
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      connected = true;
      socket.destroy();
      resolve({ success: true, port });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ success: false, port, error: 'Connection timeout' });
    });
    
    socket.on('error', (error) => {
      resolve({ success: false, port, error: error.message });
    });
    
    try {
      socket.connect(port, host);
    } catch (error) {
      resolve({ success: false, port, error: error.message });
    }
  });
}

async function runPortTests() {
  console.log('Testing connectivity to smtp.gmail.com...\n');
  
  for (const testConfig of testPorts) {
    process.stdout.write(`📡 Port ${testConfig.port} (${testConfig.name}): `);
    
    const result = await testPort('smtp.gmail.com', testConfig.port, 10000);
    
    if (result.success) {
      console.log('✅ OPEN');
    } else {
      console.log(`❌ BLOCKED (${result.error})`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🔍 Analysis:\n');
  
  const port587Test = await testPort('smtp.gmail.com', 587);
  const port465Test = await testPort('smtp.gmail.com', 465);
  
  if (port587Test.success) {
    console.log('✅ RECOMMENDATION: Use Port 587');
    console.log('   SMTP_HOST=smtp.gmail.com');
    console.log('   SMTP_PORT=587');
    console.log('   SMTP_SECURE=false\n');
  } else if (port465Test.success) {
    console.log('⚠️  Port 465 accessible but may have issues');
    console.log('   Your connection logs show it closes immediately');
    console.log('   This often indicates ISP filtering\n');
  } else {
    console.log('❌ Both major SMTP ports blocked!');
    console.log('   Your ISP likely blocks outgoing SMTP');
    console.log('   Try mobile hotspot or VPN\n');
  }
  
  // Test with alternative methods
  console.log('🔬 Additional Tests:\n');
  
  // Test if port opens but closes immediately (like your issue)
  console.log('Testing connection stability on port 465...');
  try {
    const socket = new net.Socket();
    let startTime = Date.now();
    
    socket.connect(465, 'smtp.gmail.com');
    
    socket.on('connect', () => {
      console.log('   ✅ Connected to port 465');
      
      setTimeout(() => {
        const duration = Date.now() - startTime;
        console.log(`   ⏱️  Connection duration: ${duration}ms`);
        
        if (duration < 5000) {
          console.log('   ⚠️  Connection closed too quickly - ISP filtering likely');
          console.log('   💡 Solution: Use port 587 or try mobile hotspot');
        }
        
        socket.destroy();
      }, 3000);
    });
    
    socket.on('error', (error) => {
      console.log('   ❌ Connection failed:', error.message);
    });
    
    socket.on('close', () => {
      const duration = Date.now() - startTime;
      console.log(`   📝 Connection closed after ${duration}ms`);
    });
    
  } catch (error) {
    console.log('   ❌ Test failed:', error.message);
  }
}

// Test DNS resolution
async function testDNS() {
  console.log('🔍 DNS Resolution Test:\n');
  
  const dns = require('dns').promises;
  
  try {
    const addresses = await dns.resolve4('smtp.gmail.com');
    console.log('✅ DNS Resolution successful:');
    addresses.forEach(addr => console.log(`   📍 ${addr}`));
    console.log('');
  } catch (error) {
    console.log('❌ DNS Resolution failed:', error.message);
    console.log('   💡 Check your DNS settings\n');
  }
}

// Main execution
async function main() {
  await testDNS();
  await runPortTests();
  
  console.log('\n🛠️  IMMEDIATE FIX FOR YOUR ISSUE:');
  console.log('1. Update .env file:');
  console.log('   SMTP_PORT=587');
  console.log('   SMTP_SECURE=false');
  console.log('');
  console.log('2. Restart backend server');
  console.log('');
  console.log('3. If still fails, try mobile hotspot');
  console.log('');
  console.log('4. Generate new Gmail App Password:');
  console.log('   https://myaccount.google.com/apppasswords');
}

main().catch(console.error);