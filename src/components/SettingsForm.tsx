'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { updateSettings } from '@/app/actions';

export default function SettingsForm({ initialSettings }) {
  const [settings, setSettings] = useState(initialSettings);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateSettings(settings);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between space-x-2">
        <div>
          <Label htmlFor="realtimeTracking">Real-time Email Tracking</Label>
          <p className="text-sm text-muted-foreground">
            Track when recipients open your emails automatically
          </p>
        </div>
        <Switch
          id="realtimeTracking"
          checked={settings.realtimeTracking || false}
          onCheckedChange={(checked) => 
            setSettings(prev => ({ ...prev, realtimeTracking: checked }))
          }
        />
      </div>
      <Button type="submit">Save Settings</Button>
    </form>
  );
}