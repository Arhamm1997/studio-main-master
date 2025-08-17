// backend/smtp-test.js - SMTP Connection Troubleshooting Tool
// Usage: node smtp-test.js

require('dotenv').config();

console.log('🔧 SMTP Connection Troubleshooting Tool\n');
console.log('=' .repeat(50));

// Check if nodemailer is installed
let nodemailer;
try {
  nodemailer = require('nodemailer');
  console.log('✅ Nodemailer is installed');
} catch (error) {
  console.log('❌ Nodemailer is not installed');
  console.log('💡 Install with: npm install nodemailer');
  process.exit(1);
}

// Check environment variables
console.log('\n📋 Environment Variables Check:');
console.log('SMTP_HOST:', process.env.SMTP_HOST || '❌ Not set');
console.log('SMTP_PORT:', process.env.SMTP_PORT || '❌ Not set');
console.log('SMTP_SECURE:', process.env.SMTP_SECURE || '❌ Not set (will default to false)');
console.log('SMTP_USER:', process.env.SMTP_USER || '❌ Not set');
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ Set (' + process.env.SMTP_PASSWORD.length + ' characters)' : '❌ Not set');
console.log('SMTP_FROM_EMAIL:', process.env.SMTP_FROM_EMAIL || '❌ Not set');

// Check for missing variables
const requiredVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('\n❌ Missing required environment variables:', missingVars.join(', '));
  console.log('💡 Create a .env file in the backend directory with these variables');
  process.exit(1);
}

// Test different SMTP configurations
async function testSMTPConfigurations() {
  console.log('\n🔍 Testing SMTP Configurations...\n');
  
  const configurations = [
    {
      name: 'Gmail Port 587 (Recommended)',
      config: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
      }
    },
    {
      name: 'Gmail Port 465 (SSL)',
      config: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
      }
    },
    {
      name: 'Current .env Configuration',
      config: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
      }
    }
  ];
  
  for (const testConfig of configurations) {
    console.log(`📧 Testing: ${testConfig.name}`);
    console.log(`   Host: ${testConfig.config.host}:${testConfig.config.port}`);
    console.log(`   Secure: ${testConfig.config.secure}`);
    
    try {
      const transporter = nodemailer.createTransporter || nodemailer.createTransport;
      const testTransporter = transporter(testConfig.config);
      
      // Test connection
      const verifyPromise = testTransporter.verify();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      );
      
      await Promise.race([verifyPromise, timeoutPromise]);
      
      console.log('   ✅ Connection successful!\n');
      
      // Try sending a test email
      console.log('   📤 Attempting to send test email...');
      
      const testMailOptions = {
        from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        to: process.env.SMTP_USER,
        subject: `SMTP Test Success - ${testConfig.name}`,
        text: `Test email sent successfully using ${testConfig.name} at ${new Date().toLocaleString()}`,
        html: `
          <h2>✅ SMTP Test Successful!</h2>
          <p><strong>Configuration:</strong> ${testConfig.name}</p>
          <p><strong>Host:</strong> ${testConfig.config.host}:${testConfig.config.port}</p>
          <p><strong>Secure:</strong> ${testConfig.config.secure}</p>
          <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
          <p style="color: green;">Your SMTP configuration is working correctly!</p>
        `
      };
      
      const sendPromise = testTransporter.sendMail(testMailOptions);
      const sendTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Send timeout after 15 seconds')), 15000)
      );
      
      const info = await Promise.race([sendPromise, sendTimeoutPromise]);
      
      console.log('   ✅ Test email sent successfully!');
      console.log('   📨 Message ID:', info.messageId);
      console.log('   📬 Check your inbox for the test email\n');
      
      console.log('🎉 SMTP WORKING! Use this configuration:');
      console.log('SMTP_HOST=' + testConfig.config.host);
      console.log('SMTP_PORT=' + testConfig.config.port);
      console.log('SMTP_SECURE=' + testConfig.config.secure);
      console.log('SMTP_USER=' + process.env.SMTP_USER);
      console.log('SMTP_PASSWORD=' + process.env.SMTP_PASSWORD);
      console.log('SMTP_FROM_EMAIL=' + (process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER));
      return;
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}\n`);
      
      // Specific error diagnostics
      if (error.message.includes('Invalid login')) {
        console.log('   💡 Authentication Error - Try:');
        console.log('      1. Enable 2-Factor Authentication on Gmail');
        console.log('      2. Generate new App Password');
        console.log('      3. Use 16-character app password (no spaces)');
      } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        console.log('   💡 Timeout Error - Try:');
        console.log('      1. Check internet connection');
        console.log('      2. Try different port (587 vs 465)');
        console.log('      3. Check firewall settings');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.log('   💡 Connection Refused - Try:');
        console.log('      1. Verify host and port');
        console.log('      2. Check if ISP blocks SMTP');
      } else if (error.message.includes('socket close')) {
        console.log('   💡 Socket Close Error - Try:');
        console.log('      1. Use port 587 with secure: false');
        console.log('      2. Check network stability');
        console.log('      3. Try again in a few minutes');
      }
      console.log('');
    }
  }
  
  console.log('❌ All SMTP configurations failed!');
  console.log('\n🆘 TROUBLESHOOTING STEPS:');
  console.log('1. Verify Gmail credentials are correct');
  console.log('2. Enable 2-Factor Authentication');
  console.log('3. Generate new App Password');
  console.log('4. Check internet connection');
  console.log('5. Try different network (mobile hotspot)');
  console.log('6. Contact your ISP about SMTP port blocking');
}

// Check Gmail app password format
function checkPasswordFormat() {
  console.log('\n🔑 App Password Check:');
  
  const password = process.env.SMTP_PASSWORD;
  if (!password) {
    console.log('❌ No password set');
    return;
  }
  
  console.log('Password length:', password.length);
  
  if (password.length === 16 && !/\s/.test(password)) {
    console.log('✅ Password format looks correct (16 characters, no spaces)');
  } else if (password.length === 19 && password.includes(' ')) {
    console.log('⚠️  Password has spaces - should remove them');
    console.log('💡 Try: ' + password.replace(/\s/g, ''));
  } else {
    console.log('⚠️  Password format may be incorrect');
    console.log('💡 Gmail app passwords are 16 characters without spaces');
  }
}

// Run all tests
async function runTests() {
  checkPasswordFormat();
  await testSMTPConfigurations();
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught error:', error.message);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error.message);
});

// Run the tests
runTests().catch(console.error);