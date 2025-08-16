// components/TrackingDebug.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TrackingDebugProps {
  settings: any;
  contacts: any[];
}

export default function TrackingDebug({ settings, contacts }: TrackingDebugProps) {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testTracking = async () => {
    setIsLoading(true);
    try {
      // Test with a dummy contact ID
      const response = await fetch('/api/track/test-123');
      if (response.ok) {
        setTestResult('✅ Tracking endpoint working!');
      } else {
        setTestResult('❌ Tracking endpoint failed');
      }
    } catch (error) {
      setTestResult('❌ Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sentContacts = contacts.filter(c => c.status === 'Sent');
  const openedContacts = contacts.filter(c => c.status === 'Opened');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>📧 Email Tracking Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Tracking Status */}
        <div className="space-y-2">
          <h4 className="font-semibold">Tracking Configuration:</h4>
          <div className="flex gap-2">
            <Badge variant={settings.realtimeTracking ? "default" : "destructive"}>
              Real-time Tracking: {settings.realtimeTracking ? 'ON' : 'OFF'}
            </Badge>
          </div>
          
          {!settings.realtimeTracking && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">
                ⚠️ Real-time tracking is disabled. Enable it in Settings to track email opens.
              </p>
            </div>
          )}
        </div>

        {/* Email Stats */}
        <div className="space-y-2">
          <h4 className="font-semibold">Email Statistics:</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-600">Emails Sent</p>
              <p className="text-2xl font-bold text-blue-800">{sentContacts.length}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-md">
              <p className="text-sm text-green-600">Emails Opened</p>
              <p className="text-2xl font-bold text-green-800">{openedContacts.length}</p>
            </div>
          </div>
        </div>

        {/* Test Tracking */}
        <div className="space-y-2">
          <h4 className="font-semibold">Test Tracking Endpoint:</h4>
          <Button 
            onClick={testTracking} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Testing...' : 'Test Tracking'}
          </Button>
          {testResult && (
            <p className="text-sm mt-2">{testResult}</p>
          )}
        </div>

        {/* Recent Opens */}
        {openedContacts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Recent Opens:</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {openedContacts.slice(0, 5).map(contact => (
                <div key={contact.id} className="text-sm p-2 bg-gray-50 rounded">
                  <span className="font-medium">{contact.firstName} {contact.lastName}</span>
                  <span className="text-gray-500 ml-2">
                    {contact.openTimestamp ? new Date(contact.openTimestamp).toLocaleString() : 'No timestamp'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tracking URL Example */}
        <div className="space-y-2">
          <h4 className="font-semibold">Tracking URL Format:</h4>
          <code className="text-xs bg-gray-100 p-2 rounded block">
            {process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/track/[contactId]
          </code>
        </div>

      </CardContent>
    </Card>
  );
}