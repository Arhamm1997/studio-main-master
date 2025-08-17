// src/lib/storage.ts - ENHANCED WITH EXACT TIMESTAMP SUPPORT
import { promises as fs } from 'fs';
import path from 'path';
import type { Contact, EmailRecord, AppSettings } from './types';

const dataDir = path.join(process.cwd(), 'data');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Default settings with all required fields
const defaultSettings: AppSettings = {
  teamLeadName: "The Bagga Bugs Team",
  realtimeTracking: true,
  companyName: "Bagga Bugs",
  fromEmail: "contact@baggabugs.dev",
  replyToEmail: "reply@baggabugs.dev"
};

// ================================
// ENHANCED CONTACTS STORAGE FUNCTIONS
// ================================

export async function loadContacts(): Promise<Contact[]> {
  try {
    await ensureDataDir();
    const contactsPath = path.join(dataDir, 'contacts.json');
    const data = await fs.readFile(contactsPath, 'utf-8');
    const contacts = JSON.parse(data);
    
    // Ensure all contacts have required fields with proper timestamp validation
    return contacts.map((contact: any) => ({
      id: contact.id || Date.now().toString(),
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      status: contact.status || 'Pending',
      sentTimestamp: contact.sentTimestamp || null,
      openTimestamp: contact.openTimestamp || null,
      ...contact // Keep any additional fields
    })).sort((a: Contact, b: Contact) => {
      // Sort by most recent activity (open time, then sent time, then ID)
      const aTime = a.openTimestamp || a.sentTimestamp || '0';
      const bTime = b.openTimestamp || b.sentTimestamp || '0';
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  } catch (error) {
    console.log('No contacts file found, starting with empty array');
    return [];
  }
}

export async function saveContacts(contacts: Contact[]): Promise<void> {
  try {
    await ensureDataDir();
    const contactsPath = path.join(dataDir, 'contacts.json');
    
    // Validate timestamps before saving
    const validatedContacts = contacts.map(contact => ({
      ...contact,
      sentTimestamp: contact.sentTimestamp && isValidTimestamp(contact.sentTimestamp) 
        ? contact.sentTimestamp 
        : null,
      openTimestamp: contact.openTimestamp && isValidTimestamp(contact.openTimestamp) 
        ? contact.openTimestamp 
        : null
    }));
    
    await fs.writeFile(contactsPath, JSON.stringify(validatedContacts, null, 2));
    console.log(`💾 Saved ${contacts.length} contacts with validated timestamps`);
  } catch (error) {
    console.error('❌ Error saving contacts:', error);
    throw error;
  }
}

export async function addContact(contact: Omit<Contact, 'id' | 'status' | 'sentTimestamp' | 'openTimestamp'>): Promise<Contact> {
  const contacts = await loadContacts();
  const newId = (Math.max(0, ...contacts.map(c => parseInt(c.id) || 0)) + 1).toString();
  
  const newContact: Contact = {
    ...contact,
    id: newId,
    status: 'Pending',
    sentTimestamp: null,
    openTimestamp: null,
  };
  
  contacts.push(newContact);
  await saveContacts(contacts);
  return newContact;
}

// ENHANCED: Update contact with exact timestamp validation
export async function updateContact(contactId: string, updates: Partial<Contact>): Promise<boolean> {
  try {
    console.log(`🔄 Updating contact ${contactId} with:`, updates);
    
    const contacts = await loadContacts();
    const contactIndex = contacts.findIndex(c => c.id === contactId);
    
    if (contactIndex === -1) {
      console.log(`⚠️ Contact ${contactId} not found for update`);
      return false;
    }
    
    const currentContact = contacts[contactIndex];
    const updatedContact = { ...currentContact, ...updates };
    
    // ENHANCED: Validate and log timestamp updates
    if (updates.openTimestamp) {
      if (!isValidTimestamp(updates.openTimestamp)) {
        console.error(`❌ Invalid open timestamp for contact ${contactId}: ${updates.openTimestamp}`);
        return false;
      }
      
      // Check if this is a duplicate open
      if (currentContact.openTimestamp && currentContact.status === 'Opened') {
        console.log(`ℹ️ Contact ${contactId} already opened at ${currentContact.openTimestamp}, ignoring duplicate`);
        return false;
      }
      
      console.log(`✅ Recording exact open time for contact ${contactId}: ${updates.openTimestamp}`);
      
      // Ensure status is also updated to 'Opened'
      updatedContact.status = 'Opened';
    }
    
    if (updates.sentTimestamp) {
      if (!isValidTimestamp(updates.sentTimestamp)) {
        console.error(`❌ Invalid sent timestamp for contact ${contactId}: ${updates.sentTimestamp}`);
        return false;
      }
      
      console.log(`📤 Recording sent time for contact ${contactId}: ${updates.sentTimestamp}`);
    }
    
    contacts[contactIndex] = updatedContact;
    await saveContacts(contacts);
    
    console.log(`✅ Contact ${contactId} updated successfully with exact timestamps`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating contact ${contactId}:`, error);
    return false;
  }
}

export async function deleteContact(contactId: string): Promise<boolean> {
  try {
    const contacts = await loadContacts();
    const filteredContacts = contacts.filter(c => c.id !== contactId);
    
    if (filteredContacts.length === contacts.length) {
      console.log(`⚠️ Contact ${contactId} not found for deletion`);
      return false;
    }
    
    await saveContacts(filteredContacts);
    console.log(`🗑️ Contact ${contactId} deleted successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting contact ${contactId}:`, error);
    return false;
  }
}

// ================================
// ENHANCED EMAIL RECORDS STORAGE FUNCTIONS
// ================================

export async function loadEmailRecords(): Promise<EmailRecord[]> {
  try {
    await ensureDataDir();
    const emailsPath = path.join(dataDir, 'emails.json');
    const data = await fs.readFile(emailsPath, 'utf-8');
    const records = JSON.parse(data);
    
    // Ensure all records have required fields with timestamp validation
    return records.map((record: any) => ({
      id: record.id || Date.now().toString(),
      contactId: record.contactId || '',
      contactEmail: record.contactEmail || '',
      contactName: record.contactName || '',
      subject: record.subject || '',
      sentAt: record.sentAt && isValidTimestamp(record.sentAt) 
        ? record.sentAt 
        : new Date().toISOString(),
      openedAt: record.openedAt && isValidTimestamp(record.openedAt) 
        ? record.openedAt 
        : null,
      status: record.status || 'Sent',
      campaignData: record.campaignData || null,
      ...record // Keep any additional fields
    })).sort((a: EmailRecord, b: EmailRecord) => {
      // Sort by most recent activity
      const aTime = a.openedAt || a.sentAt;
      const bTime = b.openedAt || b.sentAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  } catch (error) {
    console.log('No email records file found, starting with empty array');
    return [];
  }
}

export async function saveEmailRecords(emails: EmailRecord[]): Promise<void> {
  try {
    await ensureDataDir();
    const emailsPath = path.join(dataDir, 'emails.json');
    
    // Validate all timestamps before saving
    const validatedRecords = emails.map(record => ({
      ...record,
      sentAt: record.sentAt && isValidTimestamp(record.sentAt) 
        ? record.sentAt 
        : new Date().toISOString(),
      openedAt: record.openedAt && isValidTimestamp(record.openedAt) 
        ? record.openedAt 
        : null
    }));
    
    await fs.writeFile(emailsPath, JSON.stringify(validatedRecords, null, 2));
    console.log(`💾 Saved ${emails.length} email records with validated timestamps`);
  } catch (error) {
    console.error('❌ Error saving email records:', error);
    throw error;
  }
}

export async function addEmailRecord(record: Omit<EmailRecord, 'id'>): Promise<EmailRecord> {
  try {
    const records = await loadEmailRecords();
    const timestamp = new Date().toISOString();
    
    const newRecord: EmailRecord = {
      ...record,
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sentAt: record.sentAt && isValidTimestamp(record.sentAt) ? record.sentAt : timestamp,
      openedAt: record.openedAt && isValidTimestamp(record.openedAt) ? record.openedAt : null
    };
    
    records.push(newRecord);
    await saveEmailRecords(records);
    console.log(`📧 Email record added for contact ${record.contactId} with exact timestamp`);
    return newRecord;
  } catch (error) {
    console.error('❌ Error adding email record:', error);
    throw error;
  }
}

// ENHANCED: Update email record with timestamp validation
export async function updateEmailRecord(recordId: string, updates: Partial<EmailRecord>): Promise<boolean> {
  try {
    const records = await loadEmailRecords();
    const recordIndex = records.findIndex(r => r.id === recordId);
    
    if (recordIndex === -1) {
      console.log(`⚠️ Email record ${recordId} not found for update`);
      return false;
    }
    
    // Validate timestamps in updates
    if (updates.openedAt && !isValidTimestamp(updates.openedAt)) {
      console.error(`❌ Invalid opened timestamp in email record update: ${updates.openedAt}`);
      return false;
    }
    
    if (updates.sentAt && !isValidTimestamp(updates.sentAt)) {
      console.error(`❌ Invalid sent timestamp in email record update: ${updates.sentAt}`);
      return false;
    }
    
    records[recordIndex] = { ...records[recordIndex], ...updates };
    await saveEmailRecords(records);
    
    console.log(`✅ Email record ${recordId} updated with validated timestamps`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating email record ${recordId}:`, error);
    return false;
  }
}

// ENHANCED: Find email record by contact ID with timestamp info
export async function getEmailRecordByContactId(contactId: string): Promise<EmailRecord | null> {
  try {
    const records = await loadEmailRecords();
    const record = records.find(r => r.contactId === contactId);
    
    if (record) {
      console.log(`📧 Found email record for contact ${contactId}: sent at ${record.sentAt}, opened at ${record.openedAt || 'not opened'}`);
    }
    
    return record || null;
  } catch (error) {
    console.error(`❌ Error finding email record for contact ${contactId}:`, error);
    return null;
  }
}

// ================================
// SETTINGS STORAGE FUNCTIONS
// ================================

export async function loadSettings(): Promise<AppSettings> {
  try {
    await ensureDataDir();
    const settingsPath = path.join(dataDir, 'settings.json');
    const data = await fs.readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(data);
    
    // Merge with defaults to ensure all fields exist
    const completeSettings: AppSettings = {
      ...defaultSettings,
      ...settings,
      // Ensure realtimeTracking exists (backward compatibility)
      realtimeTracking: settings.realtimeTracking !== undefined ? settings.realtimeTracking : true
    };
    
    console.log('⚙️ Settings loaded successfully with real-time tracking:', completeSettings.realtimeTracking);
    return completeSettings;
  } catch (error) {
    console.log('No settings file found, using defaults with real-time tracking enabled');
    return defaultSettings;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await ensureDataDir();
    
    // Ensure all required fields are present
    const settingsToSave: AppSettings = {
      teamLeadName: settings.teamLeadName || defaultSettings.teamLeadName,
      realtimeTracking: settings.realtimeTracking !== undefined ? settings.realtimeTracking : true,
      companyName: settings.companyName || defaultSettings.companyName,
      fromEmail: settings.fromEmail || defaultSettings.fromEmail,
      replyToEmail: settings.replyToEmail || defaultSettings.replyToEmail
    };
    
    const settingsPath = path.join(dataDir, 'settings.json');
    await fs.writeFile(settingsPath, JSON.stringify(settingsToSave, null, 2));
    console.log('💾 Settings saved successfully:', settingsToSave);
  } catch (error) {
    console.error('❌ Error saving settings:', error);
    throw error;
  }
}

export async function resetSettings(): Promise<AppSettings> {
  try {
    await saveSettings(defaultSettings);
    console.log('🔄 Settings reset to defaults with real-time tracking enabled');
    return defaultSettings;
  } catch (error) {
    console.error('❌ Error resetting settings:', error);
    throw error;
  }
}

// ================================
// ENHANCED UTILITY FUNCTIONS
// ================================

// Enhanced storage stats with timestamp analysis
export async function getStorageStats(): Promise<{
  contactsCount: number;
  emailRecordsCount: number;
  sentEmails: number;
  openedEmails: number;
  openRate: number;
  recentOpens: number;
  lastOpenTime: string | null;
  oldestSentTime: string | null;
  newestSentTime: string | null;
}> {
  try {
    const contacts = await loadContacts();
    const emailRecords = await loadEmailRecords();
    
    const sentEmails = contacts.filter(c => c.status === 'Sent' || c.status === 'Opened').length;
    const openedEmails = contacts.filter(c => c.status === 'Opened').length;
    const openRate = sentEmails > 0 ? parseFloat(((openedEmails / sentEmails) * 100).toFixed(2)) : 0;
    
    // Calculate recent opens (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentOpens = contacts.filter(c => 
      c.openTimestamp && new Date(c.openTimestamp) > twentyFourHoursAgo
    ).length;
    
    // Find timestamp ranges
    const openTimes = contacts
      .filter(c => c.openTimestamp)
      .map(c => c.openTimestamp!)
      .sort();
    const lastOpenTime = openTimes.length > 0 ? openTimes[openTimes.length - 1] : null;
    
    const sentTimes = contacts
      .filter(c => c.sentTimestamp)
      .map(c => c.sentTimestamp!)
      .sort();
    const oldestSentTime = sentTimes.length > 0 ? sentTimes[0] : null;
    const newestSentTime = sentTimes.length > 0 ? sentTimes[sentTimes.length - 1] : null;
    
    return {
      contactsCount: contacts.length,
      emailRecordsCount: emailRecords.length,
      sentEmails,
      openedEmails,
      openRate,
      recentOpens,
      lastOpenTime,
      oldestSentTime,
      newestSentTime
    };
  } catch (error) {
    console.error('❌ Error getting enhanced storage stats:', error);
    return {
      contactsCount: 0,
      emailRecordsCount: 0,
      sentEmails: 0,
      openedEmails: 0,
      openRate: 0,
      recentOpens: 0,
      lastOpenTime: null,
      oldestSentTime: null,
      newestSentTime: null
    };
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await saveContacts([]);
    await saveEmailRecords([]);
    await resetSettings();
    console.log('🧹 All data cleared successfully with settings reset');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

// Enhanced export with timestamp metadata
export async function exportData(): Promise<{
  contacts: Contact[];
  emailRecords: EmailRecord[];
  settings: AppSettings;
  exportedAt: string;
  timestampSummary: {
    totalContacts: number;
    contactsWithSentTime: number;
    contactsWithOpenTime: number;
    emailRecordsCount: number;
    dateRange: {
      oldestSent: string | null;
      newestSent: string | null;
      oldestOpen: string | null;
      newestOpen: string | null;
    };
  };
}> {
  try {
    const contacts = await loadContacts();
    const emailRecords = await loadEmailRecords();
    const settings = await loadSettings();
    
    // Generate timestamp summary
    const sentTimes = contacts.filter(c => c.sentTimestamp).map(c => c.sentTimestamp!);
    const openTimes = contacts.filter(c => c.openTimestamp).map(c => c.openTimestamp!);
    
    return {
      contacts,
      emailRecords,
      settings,
      exportedAt: new Date().toISOString(),
      timestampSummary: {
        totalContacts: contacts.length,
        contactsWithSentTime: sentTimes.length,
        contactsWithOpenTime: openTimes.length,
        emailRecordsCount: emailRecords.length,
        dateRange: {
          oldestSent: sentTimes.length > 0 ? sentTimes.sort()[0] : null,
          newestSent: sentTimes.length > 0 ? sentTimes.sort()[sentTimes.length - 1] : null,
          oldestOpen: openTimes.length > 0 ? openTimes.sort()[0] : null,
          newestOpen: openTimes.length > 0 ? openTimes.sort()[openTimes.length - 1] : null
        }
      }
    };
  } catch (error) {
    console.error('❌ Error exporting enhanced data:', error);
    throw error;
  }
}

export async function importData(data: {
  contacts?: Contact[];
  emailRecords?: EmailRecord[];
  settings?: AppSettings;
}): Promise<void> {
  try {
    if (data.contacts) {
      // Validate timestamps during import
      const validatedContacts = data.contacts.map(contact => ({
        ...contact,
        sentTimestamp: contact.sentTimestamp && isValidTimestamp(contact.sentTimestamp) 
          ? contact.sentTimestamp 
          : null,
        openTimestamp: contact.openTimestamp && isValidTimestamp(contact.openTimestamp) 
          ? contact.openTimestamp 
          : null
      }));
      await saveContacts(validatedContacts);
    }
    
    if (data.emailRecords) {
      // Validate timestamps during import
      const validatedRecords = data.emailRecords.map(record => ({
        ...record,
        sentAt: record.sentAt && isValidTimestamp(record.sentAt) 
          ? record.sentAt 
          : new Date().toISOString(),
        openedAt: record.openedAt && isValidTimestamp(record.openedAt) 
          ? record.openedAt 
          : null
      }));
      await saveEmailRecords(validatedRecords);
    }
    
    if (data.settings) {
      await saveSettings(data.settings);
    }
    
    console.log('📥 Data imported successfully with timestamp validation');
  } catch (error) {
    console.error('❌ Error importing data:', error);
    throw error;
  }
}

// ================================
// ENHANCED BACKUP FUNCTIONS
// ================================

export async function createBackup(): Promise<string> {
  try {
    const data = await exportData();
    await ensureDataDir();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(dataDir, `backup-${timestamp}.json`);
    
    await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
    console.log(`💾 Enhanced backup created with timestamp metadata: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('❌ Error creating enhanced backup:', error);
    throw error;
  }
}

export async function restoreFromBackup(backupPath: string): Promise<void> {
  try {
    const data = await fs.readFile(backupPath, 'utf-8');
    const backupData = JSON.parse(data);
    await importData(backupData);
    console.log(`📥 Restored from enhanced backup with timestamp validation: ${backupPath}`);
  } catch (error) {
    console.error('❌ Error restoring from backup:', error);
    throw error;
  }
}

// ================================
// TIMESTAMP VALIDATION UTILITIES
// ================================

function isValidTimestamp(timestamp: string): boolean {
  if (!timestamp) return false;
  
  try {
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return false;
    
    // Check if timestamp is in a reasonable range (not too far in past/future)
    const now = Date.now();
    const timestampMs = date.getTime();
    const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
    const oneYearFromNow = now + (365 * 24 * 60 * 60 * 1000);
    
    if (timestampMs < oneYearAgo || timestampMs > oneYearFromNow) {
      console.warn(`⚠️ Timestamp outside reasonable range: ${timestamp}`);
      return false;
    }
    
    // Check if it's a proper ISO string format
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!isoRegex.test(timestamp)) {
      console.warn(`⚠️ Timestamp not in proper ISO format: ${timestamp}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error validating timestamp "${timestamp}":`, error);
    return false;
  }
}

// Get contacts with detailed timestamp info for debugging
export async function getContactsWithTimestampInfo(): Promise<Array<Contact & {
  timestampInfo: {
    hasSentTime: boolean;
    hasOpenTime: boolean;
    sentTimeValid: boolean;
    openTimeValid: boolean;
    timeBetweenSentAndOpen?: number; // milliseconds
  };
}>> {
  try {
    const contacts = await loadContacts();
    
    return contacts.map(contact => {
      const hasSentTime = !!contact.sentTimestamp;
      const hasOpenTime = !!contact.openTimestamp;
      const sentTimeValid = contact.sentTimestamp ? isValidTimestamp(contact.sentTimestamp) : false;
      const openTimeValid = contact.openTimestamp ? isValidTimestamp(contact.openTimestamp) : false;
      
      let timeBetweenSentAndOpen: number | undefined;
      if (contact.sentTimestamp && contact.openTimestamp && sentTimeValid && openTimeValid) {
        timeBetweenSentAndOpen = new Date(contact.openTimestamp).getTime() - 
                                 new Date(contact.sentTimestamp).getTime();
      }
      
      return {
        ...contact,
        timestampInfo: {
          hasSentTime,
          hasOpenTime,
          sentTimeValid,
          openTimeValid,
          timeBetweenSentAndOpen
        }
      };
    });
  } catch (error) {
    console.error('❌ Error getting contacts with timestamp info:', error);
    return [];
  }
}