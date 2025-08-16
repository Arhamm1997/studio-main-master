import Settings from "@/components/Settings";
import { loadSettings } from "@/lib/storage";

export default async function SettingsPage() {
  const settings = await loadSettings();

  return (
    <Settings initialSettings={settings} />
  );
}