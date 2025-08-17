// backend/mock-email-service.js - Mock Email Service (No SMTP Required)

class MockEmailService {
  constructor() {
    this.sentEmails = [];
    this.isReady = true;
    console.log('🎭 Mock Email Service initialized - No SMTP required!');
  }

  // Mock verify function
  async verify() {
    return Promise.resolve(true);
  }

  // Mock sendMail function
  async sendMail(mailOptions) {
    return new Promise((resolve) => {
      // Simulate email sending delay
      setTimeout(() => {
        const mockInfo = {
          messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          accepted: [mailOptions.to],
          rejected: [],
          response: '250 Message accepted',
          envelope: {
            from: mailOptions.from,
            to: [mailOptions.to]
          }
        };

        // Store sent email for tracking
        this.sentEmails.push({
          ...mailOptions,
          sentAt: new Date().toISOString(),
          messageId: mockInfo.messageId
        });

        console.log(`📧 MOCK EMAIL SENT:`);
        console.log(`   From: ${mailOptions.from}`);
        console.log(`   To: ${mailOptions.to}`);
        console.log(`   Subject: ${mailOptions.subject}`);
        console.log(`   Message ID: ${mockInfo.messageId}`);
        console.log(`   ✅ Email would be sent successfully in real mode`);

        resolve(mockInfo);
      }, 500); // 500ms delay to simulate real sending
    });
  }

  // Get sent emails
  getSentEmails() {
    return this.sentEmails;
  }

  // Clear sent emails
  clearSentEmails() {
    this.sentEmails = [];
    console.log('🧹 Mock email history cleared');
  }
}

module.exports = MockEmailService;