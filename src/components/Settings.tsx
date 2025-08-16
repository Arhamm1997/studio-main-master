'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { updateSettings } from '@/app/actions';
import type { AppSettings } from '@/lib/types';
import { Settings as SettingsIcon, User, Mail, Building, Zap } from 'lucide-react';

interface SettingsProps {
  initialSettings: AppSettings;
}

export default function Settings({ initialSettings }: SettingsProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateSettings(settings);
        toast({
          title: "Settings Saved",
          description: "Your settings have been updated successfully!",
          className: "bg-green-100 text-green-900 border-green-200",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save settings. Please try again.",
        });
      }
    });
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <SettingsIcon className="w-8 h-8" />
          Settings
        </h1>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Configure your application's basic settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                placeholder="Your Company Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamLeadName">Team Lead Name</Label>
              <Input
                id="teamLeadName"
                value={settings.teamLeadName}
                onChange={(e) => setSettings({ ...settings, teamLeadName: e.target.value })}
                placeholder="Team Lead Name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Settings
            </CardTitle>
            <CardDescription>
              Configure your email sending preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                type="email"
                value={settings.fromEmail}
                onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
                placeholder="contact@yourcompany.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="replyToEmail">Reply-To Email</Label>
              <Input
                id="replyToEmail"
                type="email"
                value={settings.replyToEmail}
                onChange={(e) => setSettings({ ...settings, replyToEmail: e.target.value })}
                placeholder="reply@yourcompany.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tracking Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Tracking Settings
            </CardTitle>
            <CardDescription>
              Configure email open tracking and analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="realtimeTracking"
                checked={settings.realtimeTracking}
                onCheckedChange={(checked) => setSettings({ ...settings, realtimeTracking: checked })}
              />
              <Label htmlFor="realtimeTracking" className="flex flex-col gap-1">
                <span>Real-time Email Tracking</span>
                <span className="text-sm text-muted-foreground">
                  Automatically track when emails are opened and update status in real-time
                </span>
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={isPending} size="lg">
          {isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </main>
  );
}