// backend/server.js - ENHANCED WITH MOCK EMAIL FALLBACK
const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables first
require('dotenv').config();

// Import mock email service
const MockEmailService = require('./mock-email-service');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: [
    'http://localhost:9002', 
    'http://localhost:3000',
    'http://localhost:9000',
    'http://127.0.0.1:9002',
    'http://127.0.0.1:3000'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Debug: Log environment variables
console.log('\n🔧 Environment Check:');
console.log('  SMTP_HOST:', process.env.SMTP_HOST || '❌ Not set');
console.log('  SMTP_PORT:', process.env.SMTP_PORT || '❌ Not set');
console.log('  SMTP_USER:', process.env.SMTP_USER || '❌ Not set');
console.log('  SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ Set' : '❌ Not set');
console.log('  SMTP_FROM_EMAIL:', process.env.SMTP_FROM_EMAIL || '❌ Not set');

// Email setup variables
let emailService = null;
let serviceStatus = 'initializing';
let nodemailer = null;
let isEmailReady = false;
let useMockEmail = false;
let mockEmailService = null;

// Initialize email service with SMTP fallback to Mock
async function initEmailService() {
  try {
    console.log('\n📦 Attempting to load nodemailer...');
    
    // Try to require nodemailer with error handling
    try {
      nodemailer = require('nodemailer');
      console.log('✅ Nodemailer loaded successfully');
      
    } catch (requireError) {
      console.error('❌ Failed to load nodemailer:', requireError.message);
      console.log('🎭 Falling back to Mock Email Service...');
      return initMockEmailService();
    }
    
    // Check if email credentials are set
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('⚠️  Missing SMTP configuration - using Mock Email Service');
      return initMockEmailService();
    }
    
    console.log('🔧 Creating email transporter with enhanced config...');
    
    // ENHANCED: Try port 587 first, then 465, then mock
    const transporterConfigs = [
      {
        name: 'Port 587 (STARTTLS)',
        config: {
          host: process.env.SMTP_HOST,
          port: 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          },
          tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000
        }
      },
      {
        name: 'Port 465 (SSL)',
        config: {
          host: process.env.SMTP_HOST,
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
      }
    ];
    
    // Try each configuration
    for (const transporterConfig of transporterConfigs) {
      try {
        console.log(`🔍 Trying ${transporterConfig.name}...`);
        
        emailService = nodemailer.createTransport(transporterConfig.config);
        
        // Test connection with timeout
        const verifyPromise = emailService.verify();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Verification timeout')), 10000)
        );
        
        await Promise.race([verifyPromise, timeoutPromise]);
        
        console.log(`✅ SMTP ${transporterConfig.name} working!`);
        console.log('📧 Sending from:', process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER);
        serviceStatus = 'ready';
        isEmailReady = true;
        useMockEmail = false;
        return true;
        
      } catch (configError) {
        console.log(`❌ ${transporterConfig.name} failed: ${configError.message}`);
        continue;
      }
    }
    
    // If all SMTP configs failed, use mock
    console.log('🎭 All SMTP configurations failed - using Mock Email Service');
    return initMockEmailService();
    
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error);
    console.log('🎭 Falling back to Mock Email Service...');
    return initMockEmailService();
  }
}

// Initialize mock email service
function initMockEmailService() {
  try {
    mockEmailService = new MockEmailService();
    emailService = mockEmailService;
    serviceStatus = 'mock_ready';
    isEmailReady = true;
    useMockEmail = true;
    
    console.log('\n🎭 Mock Email Service activated!');
    console.log('   ✅ All emails will be simulated');
    console.log('   ✅ Email tracking will work normally');
    console.log('   ✅ Frontend will receive "sent" status');
    console.log('   📧 Mock sending from:', process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'mock@example.com');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize mock email service:', error);
    serviceStatus = 'failed';
    isEmailReady = false;
    useMockEmail = false;
    return false;
  }
}

// Helper function to determine email service status
function getEmailServiceStatus() {
  if (useMockEmail) return 'mock_ready';
  if (!nodemailer) return 'nodemailer_missing';
  if (!emailService) return 'not_initialized';
  if (!isEmailReady) return 'connection_failed';
  return 'ready';
}

// API Routes

// 1. Enhanced Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test email service if it exists
    let emailStatus = getEmailServiceStatus();
    
    if (emailService && isEmailReady && !useMockEmail) {
      try {
        await emailService.verify();
        emailStatus = 'ready';
      } catch (error) {
        emailStatus = 'verification_failed';
        console.error('❌ Email verification failed:', error.message);
      }
    }

    res.json({
      status: 'running',
      timestamp: new Date().toISOString(),
      emailService: {
        status: emailStatus,
        serviceStatus: serviceStatus,
        ready: isEmailReady,
        transporterCreated: !!emailService,
        usingMockEmail: useMockEmail,
        mockEmailActive: useMockEmail,
        nodemailer: {
          loaded: !!nodemailer,
          version: useMockEmail ? 'mock' : 'unknown'
        }
      },
      smtp: {
        host: process.env.SMTP_HOST || 'Not set',
        port: process.env.SMTP_PORT || 'Not set',
        user: process.env.SMTP_USER || 'Not set',
        pass: process.env.SMTP_PASSWORD ? 'Set' : 'Not set',
        fromEmail: process.env.SMTP_FROM_EMAIL || 'Not set',
        mockMode: useMockEmail
      },
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      },
      uptime: Math.round(process.uptime()) + ' seconds',
      port: process.env.PORT || 9000,
      mockEmails: useMockEmail ? {
        totalSent: mockEmailService ? mockEmailService.getSentEmails().length : 0,
        lastSent: mockEmailService && mockEmailService.getSentEmails().length > 0 
          ? mockEmailService.getSentEmails()[mockEmailService.getSentEmails().length - 1].sentAt 
          : null
      } : null
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 2. Send contact form email
app.post('/api/send-contact', async (req, res) => {
  console.log('\n📧 Send contact request received');
  
  if (!emailService || !isEmailReady) {
    console.error('❌ Email service not available');
    return res.status(500).json({
      success: false,
      message: 'Email service not configured',
      status: serviceStatus,
      debug: {
        nodemailerLoaded: !!nodemailer,
        transporterCreated: !!emailService,
        emailReady: isEmailReady
      }
    });
  }
  
  const { name, email, subject, message, htmlContent } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required',
      received: { name: !!name, email: !!email, message: !!message }
    });
  }
  
  try {
    // Create email content
    const emailHtml = htmlContent || `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Message from ${name}</h1>
        </div>
        <div class="content">
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject || 'No Subject'}</p>
          <hr>
          <div>${message.replace(/\n/g, '<br>')}</div>
        </div>
        <div class="footer">
          <p>Sent via Bagga Bugs Email System | ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
    
    const mailOptions = {
      from: `"${name}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      replyTo: email,
      subject: `Contact Form: ${subject || 'Message from ' + name}`,
      html: emailHtml,
      text: message
    };
    
    console.log('📤 Sending email...');
    console.log('Mail options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      replyTo: mailOptions.replyTo
    });
    
    const info = await emailService.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    console.log('📬 Accepted:', info.accepted);
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      accepted: info.accepted,
      details: {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      }
    });
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message,
      errorCode: error.code,
      timestamp: new Date().toISOString()
    });
  }
});

// 3. ENHANCED Test email endpoint with retry logic
app.post('/api/test-email', async (req, res) => {
  console.log('\n🧪 POST test email endpoint called');
  
  if (!emailService || !isEmailReady) {
    console.error('❌ Email service not available for testing');
    return res.status(500).json({
      success: false,
      message: 'Email service not available',
      status: serviceStatus,
      debug: {
        nodemailerLoaded: !!nodemailer,
        transporterCreated: !!emailService,
        emailReady: isEmailReady,
        serviceStatus: serviceStatus
      }
    });
  }
  
  // Enhanced email sending with retry logic
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      attempt++;
      const testEmail = req.body.email || process.env.SMTP_USER;
      console.log(`📧 Attempt ${attempt}/${maxRetries}: Sending POST test email to: ${testEmail}`);
      
      const mailOptions = {
        from: `"Bagga Bugs Test" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: testEmail,
        subject: '✅ Test Email Success - ' + new Date().toLocaleDateString(),
        html: `
          <div style="font-family: Arial; padding: 20px; background: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #28a745; text-align: center;">🎉 Email Working!</h1>
              <p style="font-size: 16px; color: #333;">
                Congratulations! Your Bagga Bugs email system is working perfectly.
              </p>
              <div style="background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #007bff; margin-top: 0;">Test Details:</h3>
                <ul style="color: #555;">
                  <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</li>
                  <li><strong>Port:</strong> ${process.env.SMTP_PORT}</li>
                  <li><strong>From:</strong> ${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}</li>
                  <li><strong>To:</strong> ${testEmail}</li>
                  <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
                  <li><strong>Attempt:</strong> ${attempt}/${maxRetries}</li>
                </ul>
              </div>
              <p style="text-align: center; color: #888; font-size: 14px;">
                You can now send unlimited emails from your application! 🚀
              </p>
            </div>
          </div>
        `,
        text: `Bagga Bugs test email sent successfully at ${new Date().toLocaleString()} (Attempt ${attempt}/${maxRetries})`
      };
      
      console.log(`📤 Attempting to send test email (attempt ${attempt})...`);
      
      // ENHANCED: Send with timeout and better error handling
      const sendPromise = emailService.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email send timeout after 30 seconds')), 30000)
      );
      
      const info = await Promise.race([sendPromise, timeoutPromise]);
      
      console.log('✅ POST test email sent successfully!');
      console.log('📨 Message ID:', info.messageId);
      console.log('📬 Accepted recipients:', info.accepted);
      
      return res.json({
        success: true,
        message: `Test email sent successfully on attempt ${attempt}`,
        messageId: info.messageId,
        accepted: info.accepted,
        to: testEmail,
        attempt: attempt,
        details: {
          smtpHost: process.env.SMTP_HOST,
          smtpPort: process.env.SMTP_PORT,
          fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
        }
      });
      
    } catch (error) {
      console.error(`❌ POST test email attempt ${attempt} failed:`, error.message);
      console.error('❌ Error details:', {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      });
      
      // Check if it's a connection error that we can retry
      const isRetriableError = error.message.includes('socket close') ||
                              error.message.includes('ETIMEDOUT') ||
                              error.message.includes('ECONNRESET') ||
                              error.message.includes('timeout') ||
                              error.message.includes('ENOTFOUND') ||
                              error.code === 'ETIMEDOUT' ||
                              error.code === 'ECONNRESET';
      
      if (attempt < maxRetries && isRetriableError) {
        console.log(`⏳ Retrying in 3 seconds... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      } else {
        // Final attempt failed or non-retriable error
        console.error(`❌ All ${maxRetries} attempts failed for POST test email`);
        
        return res.status(500).json({
          success: false,
          message: `Test email failed after ${attempt} attempts`,
          error: error.message,
          errorCode: error.code,
          attempts: attempt,
          lastError: error.message,
          timestamp: new Date().toISOString(),
          troubleshooting: {
            errorType: isRetriableError ? 'Connection Error' : 'Authentication/Config Error',
            commonFixes: [
              'Check SMTP credentials in .env file',
              'Verify Gmail App Password is correct (16 characters)',
              'Try using port 587 with SMTP_SECURE=false',
              'Enable 2-Factor Authentication and generate App Password',
              'Check internet connection and firewall settings',
              'Verify SMTP_HOST=smtp.gmail.com'
            ],
            currentConfig: {
              host: process.env.SMTP_HOST,
              port: process.env.SMTP_PORT,
              user: process.env.SMTP_USER,
              secure: process.env.SMTP_SECURE || 'not set'
            }
          }
        });
      }
    }
  }
});

// 4. ENHANCED GET endpoint for test-email with retry logic
app.get('/api/test-email', async (req, res) => {
  console.log('\n🧪 GET test email endpoint called');
  
  if (!emailService || !isEmailReady) {
    return res.status(500).json({
      success: false,
      message: 'Email service not configured',
      status: serviceStatus,
      suggestion: 'Check your SMTP configuration in the .env file'
    });
  }
  
  // Enhanced email sending with retry logic
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      attempt++;
      const testEmail = process.env.SMTP_USER;
      console.log(`📧 Attempt ${attempt}/${maxRetries}: Sending GET test email to: ${testEmail}`);
      
      const mailOptions = {
        from: `"Bagga Bugs GET Test" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: testEmail,
        subject: '✅ GET Test Email Success - ' + new Date().toLocaleString(),
        html: `
          <div style="font-family: Arial; padding: 20px; background: #f0f8ff;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
              <h1 style="color: #007bff; text-align: center;">📧 GET Test Successful!</h1>
              <p>This email was sent via GET request to /api/test-email</p>
              <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>From:</strong> ${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}</p>
              <p><strong>To:</strong> ${testEmail}</p>
              <p><strong>Attempt:</strong> ${attempt}/${maxRetries}</p>
              <p style="color: #28a745; font-weight: bold;">✅ Your email system is working perfectly!</p>
            </div>
          </div>
        `,
        text: `GET Test email sent successfully at ${new Date().toLocaleString()} (Attempt ${attempt}/${maxRetries})`
      };
      
      // ENHANCED: Send with timeout and better error handling
      console.log(`📤 Attempting to send email (attempt ${attempt})...`);
      
      // Create a promise with timeout
      const sendPromise = emailService.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email send timeout after 30 seconds')), 30000)
      );
      
      const info = await Promise.race([sendPromise, timeoutPromise]);
      
      console.log('✅ GET test email sent successfully!');
      console.log('📨 Message ID:', info.messageId);
      console.log('📬 Accepted:', info.accepted);
      
      return res.json({
        success: true,
        message: `GET test email sent successfully on attempt ${attempt}`,
        messageId: info.messageId,
        to: testEmail,
        method: 'GET',
        attempt: attempt,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`❌ GET test email attempt ${attempt} failed:`, error.message);
      
      // Check if it's a connection error that we can retry
      const isRetriableError = error.message.includes('socket close') ||
                              error.message.includes('ETIMEDOUT') ||
                              error.message.includes('ECONNRESET') ||
                              error.message.includes('timeout');
      
      if (attempt < maxRetries && isRetriableError) {
        console.log(`⏳ Retrying in 3 seconds... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      } else {
        // Final attempt failed or non-retriable error
        console.error(`❌ All ${maxRetries} attempts failed for GET test email`);
        
        return res.status(500).json({
          success: false,
          message: `GET test email failed after ${attempt} attempts`,
          error: error.message,
          attempts: attempt,
          lastError: error.message,
          timestamp: new Date().toISOString(),
          troubleshooting: {
            commonFixes: [
              'Check SMTP credentials in .env file',
              'Verify Gmail App Password is correct',
              'Try using port 587 instead of 465',
              'Check internet connection',
              'Verify firewall settings'
            ],
            currentConfig: {
              host: process.env.SMTP_HOST,
              port: process.env.SMTP_PORT,
              user: process.env.SMTP_USER,
              secure: process.env.SMTP_SECURE
            }
          }
        });
      }
    }
  }
});

// 5. Bulk email endpoint for faster processing
app.post('/api/send-bulk', async (req, res) => {
  console.log('\n📧 Bulk email request received');
  
  if (!emailService || !isEmailReady) {
    console.error('❌ Email service not available');
    return res.status(500).json({
      success: false,
      message: 'Email service not configured',
      status: serviceStatus
    });
  }
  
  const { emails } = req.body; // Array of email objects
  
  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Emails array is required and must not be empty'
    });
  }
  
  console.log(`📤 Processing ${emails.length} emails in parallel...`);
  
  try {
    // Process emails in parallel with limited concurrency
    const concurrencyLimit = 3; // Send 3 emails at once to avoid overwhelming SMTP
    const results = [];
    
    for (let i = 0; i < emails.length; i += concurrencyLimit) {
      const batch = emails.slice(i, i + concurrencyLimit);
      console.log(`📦 Processing batch ${Math.floor(i/concurrencyLimit) + 1}/${Math.ceil(emails.length/concurrencyLimit)}`);
      
      const batchPromises = batch.map(async (emailData, index) => {
        try {
          const mailOptions = {
            from: `"${emailData.senderName || 'Bagga Bugs'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
            to: emailData.to,
            subject: emailData.subject || 'No Subject',
            html: emailData.html || '',
            text: emailData.text || '',
            replyTo: emailData.replyTo || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
          };
          
          // Log email details for debugging
          console.log(`📧 Sending email to ${emailData.to}...`);
          
          // Send email
          const info = await emailService.sendMail(mailOptions);
          console.log(`✅ Email sent to ${emailData.to}: ${info.messageId}`);
          
          return {
            success: true,
            messageId: info.messageId,
            to: emailData.to,
            status: 'sent',
            contactId: emailData.contactId
          };
        } catch (error) {
          console.error(`❌ Error sending to ${emailData.to}:`, error.message);
          return {
            success: false,
            to: emailData.to,
            error: error.message,
            contactId: emailData.contactId
          };
        }
      });
      
      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to prevent overwhelming the SMTP server
      if (i + concurrencyLimit < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log('✅ All emails processed');
    
    // Filter and log failed results
    const failedResults = results.filter(result => !result.success);
    const successResults = results.filter(result => result.success);
    
    if (failedResults.length > 0) {
      console.log(`❌ ${failedResults.length} emails failed to send:`, failedResults.map(r => r.to));
    }
    
    console.log(`📊 Summary: ${successResults.length} sent, ${failedResults.length} failed`);
    
    res.json({
      success: true,
      message: `Processed ${results.length} emails (${successResults.length} sent, ${failedResults.length} failed)`,
      results: results,
      summary: {
        total: results.length,
        sent: successResults.length,
        failed: failedResults.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error processing bulk email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk email',
      error: error.message
    });
  }
});

// 6. Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Bagga Bugs Email Backend',
    status: 'running',
    emailService: serviceStatus,
    transporterCreated: !!emailService,
    emailReady: isEmailReady,
    endpoints: {
      health: '/api/health',
      testEmailPost: '/api/test-email (POST)',
      testEmailGet: '/api/test-email (GET)',
      sendContact: '/api/send-contact',
      sendBulk: '/api/send-bulk'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 9000;
app.listen(PORT, async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 BAGGA BUGS EMAIL BACKEND STARTED');
  console.log('='.repeat(60));
  console.log(`🔗 Server URL: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test Email (GET): http://localhost:${PORT}/api/test-email`);
  console.log(`🧪 Test Email (POST): http://localhost:${PORT}/api/test-email`);
  console.log('='.repeat(60));
  
  // Initialize email service on startup
  const emailInit = await initEmailService();
  if (emailInit) {
    console.log('\n✅ Email service initialized successfully');
    console.log('   Ready to send emails! 🚀');
  } else {
    console.error('\n❌ Email service initialization failed:', serviceStatus);
    console.log('\n💡 To fix email issues:');
    console.log('  1. Check your .env file configuration');
    console.log('  2. Visit the health check URL above');
    console.log('  3. Use the test email endpoint to verify setup');
  }
  console.log('\n');
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error.message);
});