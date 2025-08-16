'use server';

import { db, refreshDbFromStorage } from '@/lib/db';
import { saveContacts, addEmailRecord, loadSettings, saveSettings } from '@/lib/storage';
import type { Campaign, Contact, AppSettings } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Backend URL configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:9000';

// --- Data Fetching Actions ---

export async function getCampaign(): Promise<Campaign> {
  await delay(200);
  await refreshDbFromStorage();
  return db.campaign;
}

export async function getContacts(): Promise<Contact[]> {
  await delay(200);
  await refreshDbFromStorage();
  return db.contacts;
}

export async function getSettings(): Promise<AppSettings> {
  await delay(200);
  return await loadSettings();
}

export async function getAnalytics() {
  await delay(200);
  await refreshDbFromStorage();
  const contacts = db.contacts;
  const total = contacts.length;
  const sent = contacts.filter(c => c.status === 'Sent' || c.status === 'Opened').length;
  const pending = contacts.filter(c => c.status === 'Pending').length;
  const errors = contacts.filter(c => c.status === 'Error').length;
  const opened = contacts.filter(c => c.status === 'Opened').length;
  const openRate = sent > 0 ? parseFloat(((opened / sent) * 100).toFixed(2)) : 0;
  const sentRate = total > 0 ? parseFloat(((sent / total) * 100).toFixed(2)) : 0;

  return { total, sent, pending, errors, opened, openRate, sentRate };
}

// --- Data Mutation Actions ---

export async function updateSettings(settings: AppSettings) {
  await delay(500);
  await saveSettings(settings);
  await refreshDbFromStorage();
  revalidatePath('/');
  revalidatePath('/settings');
  return { success: true, message: "Settings updated successfully!" };
}

export async function updateCampaign(data: Campaign) {
  await delay(500);
  db.campaign = { ...db.campaign, ...data };
  revalidatePath('/');
  return { success: true, message: "Campaign updated successfully!" };
}

export async function addContact(contactData: Omit<Contact, 'id' | 'status' | 'sentTimestamp' | 'openTimestamp'>) {
  await delay(500);
  await refreshDbFromStorage();
  const newId = (Math.max(0, ...db.contacts.map(c => parseInt(c.id))) + 1).toString();
  const newContact: Contact = {
    ...contactData,
    id: newId,
    status: 'Pending',
    sentTimestamp: null,
    openTimestamp: null,
  };
  db.contacts.push(newContact);
  await saveContacts(db.contacts);
  revalidatePath('/');
  return { success: true, message: "Contact added!" };
}

export async function addContacts(contactsData: Omit<Contact, 'id' | 'status' | 'sentTimestamp' | 'openTimestamp'>[]) {
    await delay(500);
    await refreshDbFromStorage();
    let maxId = Math.max(0, ...db.contacts.map(c => parseInt(c.id)));
    for (const contactData of contactsData) {
        maxId++;
        const newContact: Contact = {
            ...contactData,
            id: maxId.toString(),
            status: 'Pending',
            sentTimestamp: null,
            openTimestamp: null,
        };
        db.contacts.push(newContact);
    }
    await saveContacts(db.contacts);
    revalidatePath('/');
    return { success: true, message: `${contactsData.length} contacts added!` };
}

export async function deleteContacts(ids: string[]) {
    await delay(500);
    await refreshDbFromStorage();
    db.contacts = db.contacts.filter(c => !ids.includes(c.id));
    await saveContacts(db.contacts);
    revalidatePath('/');
    return { success: true, message: "Selected contacts deleted." };
}

function capitalize(s: string) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export async function cleanContacts(ids: string[]) {
    await delay(500);
    await refreshDbFromStorage();
    let updatedCount = 0;
    db.contacts.forEach(contact => {
        if (ids.includes(contact.id)) {
            contact.email = contact.email.trim().toLowerCase();
            contact.firstName = capitalize(contact.firstName.trim());
            contact.lastName = capitalize(contact.lastName.trim());
            updatedCount++;
        }
    });
    await saveContacts(db.contacts);
    revalidatePath('/');
    return { success: true, message: `Cleaned ${updatedCount} contacts.` };
}

function createAntiSpamSubject(subject: string, firstName: string) {
  let antiSpam = subject;
  const spamWords: { [key: string]: string } = {
    'FREE': 'Complimentary', 'URGENT': 'Important', 'ACT NOW': 'Take Action',
    'LIMITED TIME': 'Special Offer', 'CLICK HERE': 'Learn More', 'BUY NOW': 'Get Started',
    'MONEY': 'Value', 'CASH': 'Savings', 'WIN': 'Receive', 'WINNER': 'Selected',
    'DEAL': 'Offer', 'SALE': 'Special Price'
  };
  for (let spam in spamWords) {
    antiSpam = antiSpam.replace(new RegExp(spam, 'gi'), spamWords[spam]);
  }
  if (antiSpam === antiSpam.toUpperCase() && antiSpam.length > 5) {
    antiSpam = antiSpam.charAt(0).toUpperCase() + antiSpam.slice(1).toLowerCase();
  }
  return antiSpam.replace(/!{2,}/g, '!').replace(/\?{2,}/g, '?');
}

function personalizeContent(content: string, contact: Omit<Contact, 'id'>, teamLeadName: string) {
  return content
    .replace(/\{\{firstName\}\}/g, contact.firstName)
    .replace(/\{\{lastName\}\}/g, contact.lastName)
    .replace(/\{\{fullName\}\}/g, `${contact.firstName} ${contact.lastName}`.trim())
    .replace(/\{\{teamLeadName\}\}/g, teamLeadName)
    .replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
}

// Test backend connection
export async function testBackendConnection() {
  try {
    console.log(`🔗 Testing connection to ${BACKEND_URL}/api/health`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const healthCheck = await fetch(`${BACKEND_URL}/api/health`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!healthCheck.ok) {
      throw new Error(`Backend server returned ${healthCheck.status}: ${healthCheck.statusText}`);
    }
    
    const health = await healthCheck.json();
    console.log('🏥 Backend health check:', health);
    
    return {
      success: true,
      health,
      message: 'Backend connection successful'
    };
    
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    
    let errorMessage = 'Unknown connection error';
    if (error.name === 'AbortError') {
      errorMessage = 'Connection timeout - backend took too long to respond';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = `Cannot connect to backend at ${BACKEND_URL}. Make sure the server is running.`;
    } else if (error.message.includes('fetch failed')) {
      errorMessage = `Network error connecting to ${BACKEND_URL}. Check if the backend server is running.`;
    } else {
      errorMessage = error.message || 'Connection failed';
    }
    
    return {
      success: false,
      error: errorMessage,
      backendUrl: BACKEND_URL
    };
  }
}

export async function sendCampaign() {
  console.log('🚀 Starting optimized email campaign...');
  await delay(500);
  
  await refreshDbFromStorage();
  const settings = await loadSettings();
  const pendingContacts = db.contacts.filter(contact => contact.status === 'Pending');
  
  if (pendingContacts.length === 0) {
    return { success: false, message: "No pending contacts to send to!" };
  }

  console.log(`📧 Found ${pendingContacts.length} contacts to email`);
  
  // Test backend connection first
  const connectionTest = await testBackendConnection();
  if (!connectionTest.success) {
    return { 
      success: false, 
      message: `Cannot connect to email backend: ${connectionTest.error}`,
      details: {
        backendUrl: connectionTest.backendUrl,
        suggestion: "Please ensure the backend server is running with: npm run dev (backend)"
      }
    };
  }
  
  const health = connectionTest.health;
  
  // Check if email service is ready
  if (health.emailService?.status !== 'ready' && health.emailService?.status !== 'loaded') {
    return {
      success: false,
      message: `Email service not ready. Status: ${health.emailService?.status || 'unknown'}`,
      details: {
        emailStatus: health.emailService,
        suggestion: "Check your SMTP configuration in the .env file"
      }
    };
  }
  
  // Prepare all emails for bulk sending
  const emailsToSend = pendingContacts.map(contact => {
    const personalizedSubject = personalizeContent(db.campaign.subject, contact, settings.teamLeadName);
    const finalSubject = createAntiSpamSubject(personalizedSubject, contact.firstName);
    const personalizedBody = personalizeContent(db.campaign.body, contact, settings.teamLeadName);
    
    // Create tracking pixel
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    const trackingPixel = settings.realtimeTracking 
      ? `<img src="${baseUrl}/api/track/${contact.id}" width="1" height="1" alt="" style="display:none;" />`
      : '';
    
    // Create proper HTML email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${finalSubject}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0; 
          }
          .content { 
            background: #fff; 
            padding: 30px; 
            border: 1px solid #ddd; 
            border-top: none; 
          }
          .footer { 
            background: #f8f9fa; 
            padding: 20px; 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
            border-radius: 0 0 10px 10px; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Message from ${settings.teamLeadName}</h1>
        </div>
        <div class="content">
          ${personalizedBody.replace(/\n/g, '<br>')}
        </div>
        <div class="footer">
          <p>Sent by ${settings.teamLeadName} | ${new Date().toLocaleDateString()}</p>
          <p>This email was sent to ${contact.email}</p>
        </div>
        ${trackingPixel}
      </body>
      </html>
    `;

    return {
      contactId: contact.id,
      to: contact.email,
      subject: finalSubject,
      html: emailHtml,
      senderName: settings.teamLeadName,
      replyTo: settings.replyToEmail
    };
  });

  try {
    console.log(`📤 Sending ${emailsToSend.length} emails via bulk API...`);
    
    // Send all emails in bulk
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const response = await fetch(`${BACKEND_URL}/api/send-bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emails: emailsToSend
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Backend error: ${errorData.message || `HTTP ${response.status}`}`);
    }

    const result = await response.json();
    console.log('✅ Bulk email response:', result);

    // Update contact statuses based on results
    let emailsSent = 0;
    let emailsFailed = 0;
    const errors: string[] = [];

    if (result.results && Array.isArray(result.results)) {
      result.results.forEach((emailResult: any) => {
        const contactEmail = emailResult.to;
        const contact = db.contacts.find(c => c.email === contactEmail);
        
        if (contact) {
          if (emailResult.success) {
            contact.status = 'Sent';
            contact.sentTimestamp = new Date().toISOString();
            emailsSent++;
            
            // Add email record (async, don't wait)
            addEmailRecord({
              contactId: contact.id,
              contactEmail: contact.email,
              contactName: `${contact.firstName} ${contact.lastName}`.trim(),
              subject: emailsToSend.find(e => e.contactId === contact.id)?.subject || '',
              sentAt: new Date().toISOString(),
              openedAt: null,
              status: 'Sent',
              campaignData: {
                subject: db.campaign.subject,
                body: db.campaign.body,
                senderName: settings.teamLeadName
              }
            }).catch(console.error);
            
          } else {
            contact.status = 'Error';
            emailsFailed++;
            errors.push(`${contact.email}: ${emailResult.error || 'Unknown error'}`);
          }
        }
      });
    }

    // Save all contact updates at once
    await saveContacts(db.contacts);
    revalidatePath('/');
    
    const resultMessage = emailsFailed > 0 
      ? `Campaign completed! ${emailsSent} emails sent successfully, ${emailsFailed} failed.`
      : `Campaign sent successfully to ${emailsSent} recipients! 🎉`;
      
    console.log(`📊 Campaign finished: ${emailsSent} sent, ${emailsFailed} failed`);
    
    return { 
      success: emailsSent > 0, 
      message: resultMessage,
      stats: {
        sent: emailsSent,
        failed: emailsFailed,
        total: pendingContacts.length
      },
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    console.error('❌ Campaign error:', error);
    
    let errorMessage = 'Campaign failed';
    if (error.name === 'AbortError') {
      errorMessage = 'Campaign timed out - this may happen with large contact lists';
    } else {
      errorMessage = `Campaign failed: ${error.message}`;
    }
    
    return {
      success: false,
      message: errorMessage,
      error: error.message,
      details: {
        backendUrl: BACKEND_URL,
        suggestion: "Check backend logs for more details"
      }
    };
  }
}

// Update contact status when email is opened (IMPROVED VERSION)
export async function updateContactOpenStatus(contactId: string) {
  try {
    console.log(`📧 Tracking: Attempting to mark contact ${contactId} as opened`);
    
    await refreshDbFromStorage();
    const contact = db.contacts.find(c => c.id === contactId);
    
    if (!contact) {
      console.log(`⚠️ Contact with ID ${contactId} not found`);
      return false;
    }
    
    // Only update if email was sent and not already opened
    if (contact.status === 'Sent') {
      contact.status = 'Opened';
      contact.openTimestamp = new Date().toISOString();
      
      await saveContacts(db.contacts);
      
      // Add email record for tracking
      await addEmailRecord({
        contactId: contact.id,
        contactEmail: contact.email,
        contactName: `${contact.firstName} ${contact.lastName}`.trim(),
        subject: '', // We don't have subject here, could store it separately
        sentAt: contact.sentTimestamp || new Date().toISOString(),
        openedAt: contact.openTimestamp,
        status: 'Opened',
        campaignData: null
      }).catch(console.error);
      
      revalidatePath('/');
      
      console.log(`✅ Contact ${contactId} (${contact.email}) marked as opened at ${contact.openTimestamp}`);
      return true;
    } else {
      console.log(`ℹ️ Contact ${contactId} status is '${contact.status}', not updating`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating contact ${contactId} open status:`, error);
    return false;
  }
}

// Test tracking function
export async function testEmailTracking() {
  await delay(200);
  
  try {
    // Find a contact with 'Sent' status for testing
    await refreshDbFromStorage();
    const sentContact = db.contacts.find(c => c.status === 'Sent');
    
    if (!sentContact) {
      return {
        success: false,
        message: "No sent emails found to test tracking with"
      };
    }
    
    // Simulate opening the email
    const result = await updateContactOpenStatus(sentContact.id);
    
    return {
      success: result,
      message: result 
        ? `Test successful! Contact ${sentContact.email} marked as opened`
        : `Test failed for contact ${sentContact.email}`,
      contactId: sentContact.id,
      contactEmail: sentContact.email
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Test failed: ${error.message}`,
      error: error.message
    };
  }
}

// Get tracking statistics
export async function getTrackingStats() {
  await delay(200);
  await refreshDbFromStorage();
  
  const contacts = db.contacts;
  const sent = contacts.filter(c => c.status === 'Sent' || c.status === 'Opened');
  const opened = contacts.filter(c => c.status === 'Opened');
  
  // Get recent opens (last 24 hours)
  const now = new Date();
  const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
  const recentOpens = contacts.filter(c => c.openTimestamp && new Date(c.openTimestamp) > yesterday);
  
  return {
    totalSent: sent.length,
    totalOpened: opened.length,
    openRate: sent.length > 0 ? parseFloat(((opened.length / sent.length) * 100).toFixed(2)) : 0,
    recentOpens: recentOpens.length,
    last24Hours: recentOpens.map(c => ({
      email: c.email,
      openedAt: c.openTimestamp
    }))
  };
}