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
// CONTACTS STORAGE FUNCTIONS
// ================================

export async function loadContacts(): Promise<Contact[]> {
  try {
    await ensureDataDir();
    const contactsPath = path.join(dataDir, 'contacts.json');
    const data = await fs.readFile(contactsPath, 'utf-8');
    const contacts = JSON.parse(data);
    
    // Ensure all contacts have required fields
    return contacts.map((contact: any) => ({
      id: contact.id || Date.now().toString(),
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      status: contact.status || 'Pending',
      sentTimestamp: contact.sentTimestamp || null,
      openTimestamp: contact.openTimestamp || null,
      ...contact // Keep any additional fields
    }));
  } catch (error) {
    console.log('No contacts file found, starting with empty array');
    return [];
  }
}

export async function saveContacts(contacts: Contact[]): Promise<void> {
  try {
    await ensureDataDir();
    const contactsPath = path.join(dataDir, 'contacts.json');
    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
    console.log(`💾 Saved ${contacts.length} contacts to file`);
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

export async function updateContact(contactId: string, updates: Partial<Contact>): Promise<boolean> {
  try {
    const contacts = await loadContacts();
    const contactIndex = contacts.findIndex(c => c.id === contactId);
    
    if (contactIndex === -1) {
      console.log(`⚠️ Contact ${contactId} not found for update`);
      return false;
    }
    
    contacts[contactIndex] = { ...contacts[contactIndex], ...updates };
    await saveContacts(contacts);
    console.log(`✅ Contact ${contactId} updated successfully`);
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
// EMAIL RECORDS STORAGE FUNCTIONS
// ================================

export async function loadEmailRecords(): Promise<EmailRecord[]> {
  try {
    await ensureDataDir();
    const emailsPath = path.join(dataDir, 'emails.json');
    const data = await fs.readFile(emailsPath, 'utf-8');
    const records = JSON.parse(data);
    
    // Ensure all records have required fields
    return records.map((record: any) => ({
      id: record.id || Date.now().toString(),
      contactId: record.contactId || '',
      contactEmail: record.contactEmail || '',
      contactName: record.contactName || '',
      subject: record.subject || '',
      sentAt: record.sentAt || new Date().toISOString(),
      openedAt: record.openedAt || null,
      status: record.status || 'Sent',
      campaignData: record.campaignData || null,
      ...record // Keep any additional fields
    }));
  } catch (error) {
    console.log('No email records file found, starting with empty array');
    return [];
  }
}

export async function saveEmailRecords(emails: EmailRecord[]): Promise<void> {
  try {
    await ensureDataDir();
    const emailsPath = path.join(dataDir, 'emails.json');
    await fs.writeFile(emailsPath, JSON.stringify(emails, null, 2));
    console.log(`💾 Saved ${emails.length} email records to file`);
  } catch (error) {
    console.error('❌ Error saving email records:', error);
    throw error;
  }
}

export async function addEmailRecord(record: Omit<EmailRecord, 'id'>): Promise<EmailRecord> {
  try {
    const records = await loadEmailRecords();
    const newRecord: EmailRecord = {
      ...record,
      id: Date.now().toString(),
      sentAt: record.sentAt || new Date().toISOString()
    };
    
    records.push(newRecord);
    await saveEmailRecords(records);
    console.log(`📧 Email record added for contact ${record.contactId}`);
    return newRecord;
  } catch (error) {
    console.error('❌ Error adding email record:', error);
    throw error;
  }
}

export async function updateEmailRecord(recordId: string, updates: Partial<EmailRecord>): Promise<boolean> {
  try {
    const records = await loadEmailRecords();
    const recordIndex = records.findIndex(r => r.id === recordId);
    
    if (recordIndex === -1) {
      console.log(`⚠️ Email record ${recordId} not found for update`);
      return false;
    }
    
    records[recordIndex] = { ...records[recordIndex], ...updates };
    await saveEmailRecords(records);
    console.log(`✅ Email record ${recordId} updated successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating email record ${recordId}:`, error);
    return false;
  }
}

export async function getEmailRecordByContactId(contactId: string): Promise<EmailRecord | null> {
  try {
    const records = await loadEmailRecords();
    return records.find(r => r.contactId === contactId) || null;
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
    
    console.log('⚙️ Settings loaded successfully');
    return completeSettings;
  } catch (error) {
    console.log('No settings file found, using defaults');
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
    console.log('🔄 Settings reset to defaults');
    return defaultSettings;
  } catch (error) {
    console.error('❌ Error resetting settings:', error);
    throw error;
  }
}

// ================================
// UTILITY FUNCTIONS
// ================================

export async function getStorageStats(): Promise<{
  contactsCount: number;
  emailRecordsCount: number;
  sentEmails: number;
  openedEmails: number;
  openRate: number;
}> {
  try {
    const contacts = await loadContacts();
    const emailRecords = await loadEmailRecords();
    
    const sentEmails = contacts.filter(c => c.status === 'Sent' || c.status === 'Opened').length;
    const openedEmails = contacts.filter(c => c.status === 'Opened').length;
    const openRate = sentEmails > 0 ? parseFloat(((openedEmails / sentEmails) * 100).toFixed(2)) : 0;
    
    return {
      contactsCount: contacts.length,
      emailRecordsCount: emailRecords.length,
      sentEmails,
      openedEmails,
      openRate
    };
  } catch (error) {
    console.error('❌ Error getting storage stats:', error);
    return {
      contactsCount: 0,
      emailRecordsCount: 0,
      sentEmails: 0,
      openedEmails: 0,
      openRate: 0
    };
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await saveContacts([]);
    await saveEmailRecords([]);
    await resetSettings();
    console.log('🧹 All data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

export async function exportData(): Promise<{
  contacts: Contact[];
  emailRecords: EmailRecord[];
  settings: AppSettings;
  exportedAt: string;
}> {
  try {
    const contacts = await loadContacts();
    const emailRecords = await loadEmailRecords();
    const settings = await loadSettings();
    
    return {
      contacts,
      emailRecords,
      settings,
      exportedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error exporting data:', error);
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
      await saveContacts(data.contacts);
    }
    if (data.emailRecords) {
      await saveEmailRecords(data.emailRecords);
    }
    if (data.settings) {
      await saveSettings(data.settings);
    }
    console.log('📥 Data imported successfully');
  } catch (error) {
    console.error('❌ Error importing data:', error);
    throw error;
  }
}

// ================================
// BACKUP FUNCTIONS
// ================================

export async function createBackup(): Promise<string> {
  try {
    const data = await exportData();
    await ensureDataDir();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(dataDir, `backup-${timestamp}.json`);
    
    await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
    console.log(`💾 Backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    throw error;
  }
}

export async function restoreFromBackup(backupPath: string): Promise<void> {
  try {
    const data = await fs.readFile(backupPath, 'utf-8');
    const backupData = JSON.parse(data);
    await importData(backupData);
    console.log(`📥 Restored from backup: ${backupPath}`);
  } catch (error) {
    console.error('❌ Error restoring from backup:', error);
    throw error;
  }
}