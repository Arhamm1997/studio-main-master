import type { Contact, Campaign } from './types';
import { loadContacts, loadSettings } from './storage';

interface Db {
  contacts: Contact[];
  campaign: Campaign;
}

// Load contacts from storage on server start
let initialContacts: Contact[] = [];
let initialSettings = {
  teamLeadName: "The Bagga Bugs Team",
  realtimeTracking: true,
  companyName: "Bagga Bugs",
  fromEmail: "contact@baggabugs.dev",
  replyToEmail: "reply@baggabugs.dev"
};

// Initialize data
async function initializeData() {
  try {
    initialContacts = await loadContacts();
    initialSettings = await loadSettings();
  } catch (error) {
    console.log('Using default data');
  }
}

// Initialize on module load
initializeData();

// In-memory "database" that syncs with persistent storage
export const db: Db = {
  contacts: initialContacts,
  campaign: {
    subject: "Hello {{firstName}}, Important Message for you",
    body: `Dear {{firstName}} {{lastName}},

We hope this message finds you well!

We wanted to share something important with you about BAGGA BUGS - our new email solution. It's designed to be powerful and easy to use.

Learn more on our website.

Best regards,
{{teamLeadName}}`,
    senderName: initialSettings.teamLeadName,
    senderEmail: initialSettings.fromEmail,
    replyTo: initialSettings.replyToEmail
  }
};

// Function to refresh db from storage
export async function refreshDbFromStorage() {
  try {
    db.contacts = await loadContacts();
    const settings = await loadSettings();
    db.campaign.senderName = settings.teamLeadName;
    db.campaign.senderEmail = settings.fromEmail;
    db.campaign.replyTo = settings.replyToEmail;
  } catch (error) {
    console.error('Error refreshing db from storage:', error);
  }
}