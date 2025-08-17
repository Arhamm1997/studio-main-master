// debug-setup.js - Run this to check your setup
// Usage: node debug-setup.js

console.log('🔧 Bagga Bugs Email Tracking Debug Script\n');

async function checkFrontend() {
  console.log('📱 1. Checking Frontend (Next.js)...');
  
  try {
    const response = await fetch('http://localhost:9002');
    if (response.ok) {
      console.log('   ✅ Frontend is running on http://localhost:9002');
    } else {
      console.log('   ❌ Frontend responded with error:', response.status);
    }
  } catch (error) {
    console.log('   ❌ Frontend not accessible on http://localhost:9002');
    console.log('   💡 Start with: npm run dev (in main directory)');
  }
  
  // Check tracking endpoint
  try {
    const trackingResponse = await fetch('http://localhost:9002/api/track/test-123?test=1');
    if (trackingResponse.ok) {
      console.log('   ✅ Tracking endpoint is working');
    } else {
      console.log('   ❌ Tracking endpoint failed:', trackingResponse.status);
    }
  } catch (error) {
    console.log('   ❌ Tracking endpoint not accessible');
  }
  
  console.log('');
}

async function checkBackend() {
  console.log('📧 2. Checking Backend (Email Server)...');
  
  try {
    const response = await fetch('http://localhost:9000/api/health');
    if (response.ok) {
      const health = await response.json();
      console.log('   ✅ Backend is running on http://localhost:9000');
      console.log(`   📧 Email service: ${health.emailService?.status || 'unknown'}`);
      console.log(`   📮 SMTP configured: ${health.smtp?.host ? 'Yes' : 'No'}`);
      
      if (health.emailService?.status !== 'ready') {
        console.log('   ⚠️  Email service not ready - check SMTP configuration');
      }
    } else {
      console.log('   ❌ Backend health check failed:', response.status);
    }
  } catch (error) {
    console.log('   ❌ Backend not accessible on http://localhost:9000');
    console.log('   💡 Start with: npm run dev (in backend directory)');
  }
  
  // Check test-email endpoint
  try {
    const testResponse = await fetch('http://localhost:9000/api/test-email');
    if (testResponse.ok) {
      const result = await testResponse.json();
      console.log('   ✅ Test email endpoint is working');
      if (result.success) {
        console.log('   📧 Test email sent successfully');
      }
    } else {
      console.log('   ❌ Test email endpoint failed:', testResponse.status);
    }
  } catch (error) {
    console.log('   ❌ Test email endpoint not accessible');
  }
  
  console.log('');
}

async function checkTestTrackingPage() {
  console.log('🧪 3. Checking Test Tracking Page...');
  
  try {
    const response = await fetch('http://localhost:9002/test-tracking');
    if (response.ok) {
      console.log('   ✅ Test tracking page is accessible');
      console.log('   🔗 Visit: http://localhost:9002/test-tracking');
    } else {
      console.log('   ❌ Test tracking page failed:', response.status);
      console.log('   💡 Make sure the page.tsx file exists in src/app/test-tracking/');
    }
  } catch (error) {
    console.log('   ❌ Test tracking page not accessible');
    console.log('   💡 Check if Next.js is running and the route exists');
  }
  
  console.log('');
}

async function checkDatabase() {
  console.log('💾 4. Checking Database/Storage...');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const dataDir = path.join(process.cwd(), 'data');
    
    if (fs.existsSync(dataDir)) {
      console.log('   ✅ Data directory exists');
      
      const contactsFile = path.join(dataDir, 'contacts.json');
      if (fs.existsSync(contactsFile)) {
        const contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf8'));
        console.log(`   📇 Contacts file: ${contacts.length} contacts found`);
        
        const sentContacts = contacts.filter(c => c.status === 'Sent' || c.status === 'Opened');
        const openedContacts = contacts.filter(c => c.status === 'Opened');
        
        console.log(`   📤 Sent emails: ${sentContacts.length}`);
        console.log(`   📖 Opened emails: ${openedContacts.length}`);
        
        if (sentContacts.length === 0) {
          console.log('   💡 No sent emails found - send a campaign to test tracking');
        }
      } else {
        console.log('   ⚠️  No contacts file found - add some contacts first');
      }
      
    } else {
      console.log('   ⚠️  Data directory not found - will be created when needed');
    }
  } catch (error) {
    console.log('   ❌ Error checking database:', error.message);
  }
  
  console.log('');
}

async function runDiagnostics() {
  console.log('🔍 5. Running Diagnostics...\n');
  
  // Test environment variables
  console.log('Environment Variables:');
  console.log(`   NEXT_PUBLIC_BASE_URL: ${process.env.NEXT_PUBLIC_BASE_URL || 'Not set (will use localhost:9002)'}`);
  console.log('');
  
  // Test tracking pixel simulation
  console.log('Testing Tracking Pixel:');
  try {
    const img = new Image();
    const testPromise = new Promise((resolve, reject) => {
      img.onload = () => resolve('loaded');
      img.onerror = () => reject(new Error('failed'));
      setTimeout(() => reject(new Error('timeout')), 3000);
    });
    
    img.src = 'http://localhost:9002/api/track/debug-test?test=1&t=' + Date.now();
    
    try {
      await testPromise;
      console.log('   ✅ Tracking pixel simulation successful');
    } catch (testError) {
      console.log('   ❌ Tracking pixel simulation failed:', testError.message);
    }
  } catch (error) {
    console.log('   ❌ Cannot test tracking pixel in Node.js environment');
    console.log('   💡 Test this manually by opening an email');
  }
  
  console.log('');
}

async function showSummary() {
  console.log('📋 Summary & Next Steps:\n');
  
  console.log('1. ✅ Make sure both servers are running:');
  console.log('   Frontend: npm run dev (main directory)');
  console.log('   Backend:  npm run dev (backend directory)');
  console.log('');
  
  console.log('2. ✅ Test the email tracking:');
  console.log('   - Go to http://localhost:9002');
  console.log('   - Add a test contact');
  console.log('   - Send campaign');
  console.log('   - Check your email and open it');
  console.log('   - Status should change to "Opened" automatically');
  console.log('');
  
  console.log('3. ✅ Use the test tracking page:');
  console.log('   - Go to http://localhost:9002/test-tracking');
  console.log('   - Use "Run Automatic Test" to validate');
  console.log('   - Check real-time status updates');
  console.log('');
  
  console.log('4. ✅ Troubleshooting:');
  console.log('   - Check console logs in browser (F12)');
  console.log('   - Check backend terminal for email logs');
  console.log('   - Verify SMTP settings in backend/.env');
  console.log('   - Make sure tracking pixel loads in emails');
  console.log('');
}

// Handle Node.js environment
if (typeof fetch === 'undefined') {
  // Fallback for older Node.js versions
  console.log('⚠️  This script works best with Node.js 18+ (has built-in fetch)');
  console.log('   Run the manual checks listed at the end instead.\n');
}

// Run all checks
async function runAllChecks() {
  console.log('Starting comprehensive system check...\n');
  console.log('='.repeat(50));
  
  await checkFrontend();
  await checkBackend();
  await checkTestTrackingPage();
  await checkDatabase();
  await runDiagnostics();
  
  console.log('='.repeat(50));
  await showSummary();
}

// Execute if run directly
if (require.main === module) {
  runAllChecks().catch(console.error);
}

module.exports = { runAllChecks };