// src/app/actions.ts - COMPLETE FIXED VERSION WITH REAL-TIME TRACKING
'use server';

import { db, refreshDbFromStorage } from '@/lib/db';
import { saveContacts, addEmailRecord, loadSettings, saveSettings, loadEmailRecords, updateContact } from '@/lib/storage';
import type { Campaign, Contact, AppSettings, EmailRecord } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Backend URL configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:9000';

// ================================
// DATA FETCHING ACTIONS (EXISTING)
// ================================

export async function getCampaign(): Promise<Campaign> {
  await delay(100);
  await refreshDbFromStorage();
  return db.campaign;
}

export async function getContacts(): Promise<Contact[]> {
  await delay(100);
  await refreshDbFromStorage();
  return db.contacts;
}

export async function getSettings(): Promise<AppSettings> {
  await delay(100);
  return await loadSettings();
}

export async function getEmailRecords(): Promise<EmailRecord[]> {
  await delay(100);
  return await loadEmailRecords();
}

// ENHANCED: Clean email records function
export async function cleanEmailRecords() {
  try {
    await delay(300);
    const { saveEmailRecords } = await import('@/lib/storage');
    await saveEmailRecords([]);
    revalidatePath('/');
    revalidatePath('/test-tracking');
    console.log('🧹 Email records cleaned successfully');
    return { success: true, message: "All email records cleared successfully!" };
  } catch (error) {
    console.error('❌ Error cleaning email records:', error);
    return { success: false, message: "Failed to clean email records." };
  }
}

// ENHANCED: Get real-time dashboard data with exact timestamps
export async function getDashboardData() {
  await delay(100);
  await refreshDbFromStorage();
  
  const campaign = db.campaign;
  const contacts = db.contacts;
  const emailRecords = await loadEmailRecords();
  
  // Calculate analytics with exact timing
  const total = contacts.length;
  const sent = contacts.filter(c => c.status === 'Sent' || c.status === 'Opened').length;
  const pending = contacts.filter(c => c.status === 'Pending').length;
  const errors = contacts.filter(c => c.status === 'Error').length;
  const opened = contacts.filter(c => c.status === 'Opened').length;
  const openRate = sent > 0 ? parseFloat(((opened / sent) * 100).toFixed(2)) : 0;
  const sentRate = total > 0 ? parseFloat(((sent / total) * 100).toFixed(2)) : 0;
  
  const analytics = { total, sent, pending, errors, opened, openRate, sentRate };
  
  // Sort email records by most recent first with exact timestamps
  const sortedEmailRecords = emailRecords.sort((a, b) => 
    new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );
  
  return {
    campaign,
    contacts,
    analytics,
    emailRecords: sortedEmailRecords
  };
}

export async function getAnalytics() {
  await delay(100);
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

// ================================
// DATA MUTATION ACTIONS (EXISTING)
// ================================

export async function updateSettings(settings: AppSettings) {
  await delay(300);
  await saveSettings(settings);
  await refreshDbFromStorage();
  revalidatePath('/');
  revalidatePath('/settings');
  return { success: true, message: "Settings updated successfully!" };
}

export async function updateCampaign(data: Campaign) {
  await delay(300);
  db.campaign = { ...db.campaign, ...data };
  revalidatePath('/');
  return { success: true, message: "Campaign updated successfully!" };
}

export async function addContact(contactData: Omit<Contact, 'id' | 'status' | 'sentTimestamp' | 'openTimestamp'>) {
  await delay(300);
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
    await delay(300);
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
    await delay(300);
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
    await delay(300);
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
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
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

// ================================
// 🔥 FIXED EMAIL TRACKING FUNCTIONS
// ================================

// 🔥 FIXED: Real-time email tracking with exact timestamp validation
export async function updateContactOpenStatus(contactId: string, exactOpenTime?: string): Promise<boolean> {
  try {
    // 🕐 EXACT TIMESTAMP - captured at moment of email open
    const preciseBrowserTimestamp = exactOpenTime || new Date().toISOString();
    
    console.log(`🔥 REAL-TIME TRACKING: Email opened for contact ${contactId} at EXACT time: ${preciseBrowserTimestamp}`);
    
    // Validate timestamp format and reasonableness
    if (!isValidTimestamp(preciseBrowserTimestamp)) {
      console.error(`❌ Invalid timestamp format: ${preciseBrowserTimestamp}`);
      return false;
    }
    
    // Load fresh data to ensure accuracy
    await refreshDbFromStorage();
    const contact = db.contacts.find(c => c.id === contactId);
    
    if (!contact) {
      console.log(`⚠️ Contact ${contactId} not found in database`);
      return false;
    }
    
    // ✅ CRITICAL: Only update if email was actually sent and not already opened
    if (contact.status !== 'Sent' && contact.status !== 'Opened') {
      console.log(`⚠️ Contact ${contactId} has status "${contact.status}" - cannot mark as opened (email must be sent first)`);
      return false;
    }
    
    // Prevent duplicate opens (check if already opened with exact same timestamp)
    if (contact.status === 'Opened' && contact.openTimestamp === preciseBrowserTimestamp) {
      console.log(`ℹ️ Contact ${contactId} already opened at this exact time: ${preciseBrowserTimestamp}`);
      return false;
    }
    
    // 🚨 CRITICAL UPDATE: Update contact status to OPENED with exact timestamp
    const wasUpdated = await updateContact(contactId, {
      status: 'Opened',
      openTimestamp: preciseBrowserTimestamp
    });
    
    if (wasUpdated) {
      // Update in-memory copy immediately for instant frontend effect
      contact.status = 'Opened';
      contact.openTimestamp = preciseBrowserTimestamp;
      
      // Update corresponding email record with exact timestamp
      try {
        const emailRecords = await loadEmailRecords();
        const emailRecord = emailRecords.find(r => r.contactId === contactId);
        
        if (emailRecord && !emailRecord.openedAt) {
          emailRecord.openedAt = preciseBrowserTimestamp;
          emailRecord.status = 'Opened';
          
          const { saveEmailRecords } = await import('@/lib/storage');
          await saveEmailRecords(emailRecords);
          
          console.log(`📧 Email record updated for contact ${contactId} - opened at ${preciseBrowserTimestamp}`);
        }
      } catch (recordError) {
        console.error(`❌ Failed to update email record for contact ${contactId}:`, recordError);
      }
      
      // 🔥 INSTANT FRONTEND UPDATE - Force immediate page refresh
      revalidatePath('/');
      revalidatePath('/test-tracking');
      
      console.log(`✅ SUCCESS: Contact ${contactId} marked as OPENED at exact time ${preciseBrowserTimestamp}`);
      return true;
    } else {
      console.error(`❌ Failed to update contact ${contactId} in database`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Critical error updating contact ${contactId} open status:`, error);
    return false;
  }
}

// 🔥 FIXED: Real email open validation (NO FALSE POSITIVES)
export async function validateEmailOpen(contactId: string): Promise<{
  success: boolean;
  opened: boolean;
  timestamp: string | null;
  message: string;
  contactExists: boolean;
  wasEmailSent: boolean;
  exactOpenTime?: string;
  contactDetails?: {
    id: string;
    email: string;
    name: string;
    status: string;
  };
}> {
  try {
    console.log(`🔍 REAL VALIDATION: Checking ACTUAL email open status for contact ${contactId}...`);
    
    // Load fresh data
    await refreshDbFromStorage();
    const contact = db.contacts.find(c => c.id === contactId);
    
    if (!contact) {
      return {
        success: false,
        opened: false,
        timestamp: null,
        message: `❌ Contact ID "${contactId}" not found in database`,
        contactExists: false,
        wasEmailSent: false
      };
    }
    
    const contactDetails = {
      id: contact.id,
      email: contact.email,
      name: `${contact.firstName} ${contact.lastName}`.trim(),
      status: contact.status
    };
    
    const wasEmailSent = contact.status === 'Sent' || contact.status === 'Opened';
    
    if (!wasEmailSent) {
      return {
        success: true,
        opened: false,
        timestamp: null,
        message: `📤 Email not sent yet to ${contactDetails.name} (${contact.email}) - Current Status: ${contact.status}`,
        contactExists: true,
        wasEmailSent: false,
        contactDetails
      };
    }
    
    // ✅ Check if ACTUALLY opened (real validation, no fake data)
    if (contact.status === 'Opened' && contact.openTimestamp) {
      const openTime = new Date(contact.openTimestamp);
      const timeAgo = formatTimeAgo(openTime);
      
      return {
        success: true,
        opened: true,
        timestamp: contact.openTimestamp,
        exactOpenTime: contact.openTimestamp,
        message: `✅ Email WAS OPENED by ${contactDetails.name} (${contact.email}) - Opened ${timeAgo}`,
        contactExists: true,
        wasEmailSent: true,
        contactDetails
      };
    }
    
    // Email was sent but NOT opened yet (real status)
    const sentTime = contact.sentTimestamp ? new Date(contact.sentTimestamp) : null;
    const sentTimeAgo = sentTime ? formatTimeAgo(sentTime) : 'unknown time';
    
    return {
      success: true,
      opened: false,
      timestamp: null,
      message: `📨 Email sent to ${contactDetails.name} (${contact.email}) ${sentTimeAgo} but NOT OPENED YET - Status: ${contact.status}`,
      contactExists: true,
      wasEmailSent: true,
      contactDetails
    };
    
  } catch (error) {
    console.error(`❌ Error validating email open for ${contactId}:`, error);
    return {
      success: false,
      opened: false,
      timestamp: null,
      message: `❌ Validation failed: ${error.message}`,
      contactExists: false,
      wasEmailSent: false
    };
  }
}

// 🔥 FIXED: Enhanced test tracking (REAL VALIDATION ONLY)
export async function testEmailTracking(): Promise<{
  success: boolean;
  message: string;
  contactId?: string;
  contactEmail?: string;
  contactName?: string;
  openTimestamp?: string;
  realOpen?: boolean;
  testPerformed: boolean;
  validationDetails?: any;
}> {
  try {
    console.log('🧪 Starting REAL email tracking validation test...');
    
    await refreshDbFromStorage();
    const contacts = db.contacts;
    
    // Find contacts that have been sent emails
    const sentContacts = contacts.filter(c => c.status === 'Sent' || c.status === 'Opened');
    
    if (sentContacts.length === 0) {
      return {
        success: false,
        message: '❌ No sent emails found to validate. Send some emails first.',
        testPerformed: false
      };
    }
    
    // Pick the most recently sent email for testing
    const sortedContacts = sentContacts.sort((a, b) => {
      const aTime = a.sentTimestamp ? new Date(a.sentTimestamp).getTime() : 0;
      const bTime = b.sentTimestamp ? new Date(b.sentTimestamp).getTime() : 0;
      return bTime - aTime;
    });
    
    const testContact = sortedContacts[0];
    
    console.log(`🎯 Testing with most recent contact: ${testContact.email} (ID: ${testContact.id})`);
    
    // ✅ REAL VALIDATION - No fake updates, only check actual status
    const validation = await validateEmailOpen(testContact.id);
    
    const contactName = `${testContact.firstName} ${testContact.lastName}`.trim();
    
    return {
      success: true,
      message: `🔍 Real validation completed for ${testContact.email}. ${validation.message}`,
      contactId: testContact.id,
      contactEmail: testContact.email,
      contactName: contactName,
      openTimestamp: validation.timestamp,
      realOpen: validation.opened,
      testPerformed: true,
      validationDetails: validation
    };
    
  } catch (error) {
    console.error('❌ Email tracking test failed:', error);
    return {
      success: false,
      message: `❌ Test failed: ${error.message}`,
      testPerformed: false
    };
  }
}

// 🔥 ENHANCED: Get real-time tracking statistics with exact timing
export async function getTrackingStats(): Promise<{
  totalSent: number;
  totalOpened: number;
  openRate: number;
  recentOpens: number;
  lastOpen: string | null;
  contacts: Contact[];
  liveOpens: number;
  veryRecentOpens: number;
  exactTiming: {
    lastOpenTime: string | null;
    timeAgo: string | null;
  };
}> {
  try {
    await refreshDbFromStorage();
    const contacts = db.contacts;
    const sentContacts = contacts.filter(c => c.status === 'Sent' || c.status === 'Opened');
    const openedContacts = contacts.filter(c => c.status === 'Opened');
    
    // Calculate time-based opens with exact precision
    const now = Date.now();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneMinuteAgo = new Date(now - 60 * 1000);
    const tenSecondsAgo = new Date(now - 10 * 1000);
    
    const recentOpens = openedContacts.filter(c => 
      c.openTimestamp && new Date(c.openTimestamp) > twentyFourHoursAgo
    ).length;
    
    const veryRecentOpens = openedContacts.filter(c => 
      c.openTimestamp && new Date(c.openTimestamp) > oneMinuteAgo
    ).length;
    
    const liveOpens = openedContacts.filter(c => 
      c.openTimestamp && new Date(c.openTimestamp) > tenSecondsAgo
    ).length;
    
    // Find most recent open with exact timestamp
    const lastOpenContact = openedContacts
      .filter(c => c.openTimestamp)
      .sort((a, b) => {
        const aTime = new Date(a.openTimestamp!).getTime();
        const bTime = new Date(b.openTimestamp!).getTime();
        return bTime - aTime;
      })[0];
    
    const openRate = sentContacts.length > 0 
      ? parseFloat(((openedContacts.length / sentContacts.length) * 100).toFixed(2))
      : 0;
    
    const exactTiming = {
      lastOpenTime: lastOpenContact?.openTimestamp || null,
      timeAgo: lastOpenContact?.openTimestamp ? formatTimeAgo(new Date(lastOpenContact.openTimestamp)) : null
    };
    
    console.log(`📊 Real-time tracking stats: ${sentContacts.length} sent, ${openedContacts.length} opened, ${liveOpens} live opens`);
    
    return {
      totalSent: sentContacts.length,
      totalOpened: openedContacts.length,
      openRate,
      recentOpens,
      lastOpen: lastOpenContact?.openTimestamp || null,
      contacts: sentContacts,
      liveOpens,
      veryRecentOpens,
      exactTiming
    };
  } catch (error) {
    console.error('❌ Error getting tracking stats:', error);
    return {
      totalSent: 0,
      totalOpened: 0,
      openRate: 0,
      recentOpens: 0,
      lastOpen: null,
      contacts: [],
      liveOpens: 0,
      veryRecentOpens: 0,
      exactTiming: {
        lastOpenTime: null,
        timeAgo: null
      }
    };
  }
}

// ================================
// ENHANCED EMAIL SENDING WITH REAL-TIME STATUS
// ================================

export async function sendCampaign() {
  console.log('🚀 Starting email campaign with REAL-TIME status updates...');
  await delay(300);
  
  await refreshDbFromStorage();
  const settings = await loadSettings();
  const pendingContacts = db.contacts.filter(contact => contact.status === 'Pending');
  
  if (pendingContacts.length === 0) {
    return { success: false, message: "No pending contacts to send to!" };
  }

  console.log(`📧 Found ${pendingContacts.length} pending contacts for campaign`);
  
  // Test backend connection first
  const connectionTest = await testBackendConnection();
  if (!connectionTest.success) {
    return { 
      success: false, 
      message: `Cannot connect to email backend: ${connectionTest.error}`,
      details: {
        backendUrl: connectionTest.backendUrl,
        suggestion: "Please ensure the backend server is running"
      }
    };
  }
  
  // 🕐 EXACT SEND TIMESTAMP - captured at moment of sending
  const preciseSendTimestamp = new Date().toISOString();
  console.log(`⏰ EXACT send timestamp: ${preciseSendTimestamp}`);
  
  // Update all contacts to "Sent" status immediately for responsive UI
  pendingContacts.forEach(contact => {
    contact.status = 'Sent';
    contact.sentTimestamp = preciseSendTimestamp;
  });
  
  await saveContacts(db.contacts);
  console.log(`✅ Updated ${pendingContacts.length} contacts to "Sent" status at ${preciseSendTimestamp}`);
  
  // Force immediate UI update
  revalidatePath('/');
  revalidatePath('/test-tracking');
  
  // Send emails via backend
  try {
    const emailsToSend = pendingContacts.map(contact => {
      const personalizedSubject = personalizeContent(db.campaign.subject, contact, settings.teamLeadName);
      const finalSubject = createAntiSpamSubject(personalizedSubject, contact.firstName);
      const personalizedBody = personalizeContent(db.campaign.body, contact, settings.teamLeadName);
      
      // Enhanced tracking pixel with exact timestamp
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
      const trackingPixel = settings.realtimeTracking 
        ? `<img src="${baseUrl}/api/track/${contact.id}?utm_source=email&utm_campaign=tracking&sent_at=${encodeURIComponent(preciseSendTimestamp)}" width="1" height="1" alt="" style="display:none !important; visibility:hidden !important; opacity:0 !important;" onload="console.log('📧 Email opened for contact ${contact.id} at exact time')" />`
        : '';
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${finalSubject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${trackingPixel}
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>Message from ${settings.teamLeadName}</h1>
          </div>
          <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none;">
            ${personalizedBody.replace(/\n/g, '<br>')}
          </div>
          <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px;">
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

    console.log(`📤 Sending ${emailsToSend.length} emails via backend...`);
    
    const response = await fetch(`${BACKEND_URL}/api/send-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails: emailsToSend }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Campaign backend response:', result);

    // Process results and create email records
    let emailsSent = 0;
    let emailsFailed = 0;

    if (result.results && Array.isArray(result.results)) {
      for (const emailResult of result.results) {
        const contact = db.contacts.find(c => c.email === emailResult.to);
        
        if (contact) {
          if (emailResult.success) {
            emailsSent++;
            
            // Create email record with exact timestamp
            await addEmailRecord({
              contactId: contact.id,
              contactEmail: contact.email,
              contactName: `${contact.firstName} ${contact.lastName}`.trim(),
              subject: emailsToSend.find(e => e.contactId === contact.id)?.subject || 'Unknown',
              sentAt: preciseSendTimestamp,
              openedAt: null,
              status: 'Sent',
              campaignData: {
                subject: db.campaign.subject,
                body: db.campaign.body,
                senderName: settings.teamLeadName
              }
            });
          } else {
            contact.status = 'Error';
            contact.sentTimestamp = null;
            emailsFailed++;
          }
        }
      }
    }

    await saveContacts(db.contacts);
    revalidatePath('/');
    revalidatePath('/test-tracking');
    
    const resultMessage = emailsFailed > 0 
      ? `Campaign completed! ${emailsSent} emails sent, ${emailsFailed} failed.`
      : `🎉 Campaign sent successfully to ${emailsSent} recipients!`;
      
    console.log(`📊 Campaign results: ${emailsSent} sent, ${emailsFailed} failed at ${preciseSendTimestamp}`);
    
    return { 
      success: emailsSent > 0, 
      message: resultMessage,
      stats: {
        sent: emailsSent,
        failed: emailsFailed,
        total: pendingContacts.length,
        sentTime: preciseSendTimestamp
      }
    };

  } catch (error) {
    console.error('❌ Campaign error:', error);
    
    // Revert contacts back to Pending on failure
    pendingContacts.forEach(contact => {
      contact.status = 'Pending';
      contact.sentTimestamp = null;
    });
    await saveContacts(db.contacts);
    revalidatePath('/');
    
    return {
      success: false,
      message: `Campaign failed: ${error.message}`,
      error: error.message
    };
  }
}

// ================================
// UTILITY FUNCTIONS
// ================================

function isValidTimestamp(timestamp: string): boolean {
  if (!timestamp) return false;
  
  try {
    const date = new Date(timestamp);
    
    if (isNaN(date.getTime())) return false;
    
    const now = Date.now();
    const timestampMs = date.getTime();
    const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
    const oneHourFromNow = now + (60 * 60 * 1000);
    
    if (timestampMs < oneYearAgo || timestampMs > oneHourFromNow) {
      console.warn(`⚠️ Timestamp outside reasonable range: ${timestamp}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error validating timestamp "${timestamp}":`, error);
    return false;
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 10) {
    return 'just now';
  } else if (diffSeconds < 60) {
    return `${diffSeconds} seconds ago`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }
}