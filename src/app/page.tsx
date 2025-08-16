import Dashboard from "@/components/Dashboard";
import { getDashboardData } from "@/app/actions";

export default async function DashboardPage() {
  // Load all dashboard data in one optimized call
  const dashboardData = await getDashboardData();

  return (
    <Dashboard
      initialCampaign={dashboardData.campaign}
      initialContacts={dashboardData.contacts}
      initialAnalytics={dashboardData.analytics}
      initialEmailRecords={dashboardData.emailRecords}
    />
  );
}