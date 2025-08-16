import Dashboard from "@/components/Dashboard";
import { getCampaign, getContacts, getAnalytics } from "@/app/actions";
import { loadEmailRecords } from "@/lib/storage";

export default async function DashboardPage() {
  const campaign = await getCampaign();
  const contacts = await getContacts();
  const analytics = await getAnalytics();
  
  // Load email records
  const emailRecords = await loadEmailRecords();
  
  // Sort email records by most recent first
  const sortedEmailRecords = emailRecords.sort((a, b) => 
    new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );

  return (
    <Dashboard
      initialCampaign={campaign}
      initialContacts={contacts}
      initialAnalytics={analytics}
      initialEmailRecords={sortedEmailRecords}
    />
  );
}