// app/test-tracking/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { testEmailTracking, getTrackingStats } from '@/app/actions';

export default function TrackingTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = async () => {
    try {
      const trackingStats = await getTrackingStats();
      setStats(trackingStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const runTest = async () => {
    setIsLoading(true);
    try {
      const result = await testEmailTracking();
      setTestResult(result);
      // Reload stats after test
      await loadStats();
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testTrackingEndpoint = async () => {
    try {
      // Test the tracking endpoint directly
      const response = await fetch('/api/track/test-123');
      if (response.ok) {
        alert('✅ Tracking endpoint is working!');
      } else {
        alert('❌ Tracking endpoint failed');
      }
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">📧 Email Tracking Test</h1>
      
      {/* Current Stats */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Current Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.totalSent}</p>
                <p className="text-sm text-gray-600">Emails Sent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.totalOpened}</p>
                <p className="text-sm text-gray-600">Emails Opened</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.openRate}%</p>
                <p className="text-sm text-gray-600">Open Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.recentOpens}</p>
                <p className="text-sm text-gray-600">Opens (24h)</p>
              </div>
            </div>
            
            {stats.lastOpen && (
              <p className="mt-4 text-sm text-gray-600">
                Last opened: {new Date(stats.lastOpen).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test Buttons */}
      <div className="flex gap-4">
        <Button onClick={runTest} disabled={isLoading}>
          {isLoading ? 'Testing...' : 'Test Email Open Simulation'}
        </Button>
        
        <Button onClick={testTrackingEndpoint} variant="outline">
          Test Tracking Endpoint
        </Button>
        
        <Button onClick={loadStats} variant="outline">
          Refresh Stats
        </Button>
      </div>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                {testResult.message}
              </p>
              {testResult.contactEmail && (
                <p className="text-sm mt-2 text-gray-600">
                  Contact: {testResult.contactEmail} (ID: {testResult.contactId})
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Test Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>To manually test email tracking:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Send a test email to yourself</li>
              <li>Open the email in your email client</li>
              <li>Wait a few seconds for the tracking pixel to load</li>
              <li>Check the dashboard - the status should change to "Opened"</li>
            </ol>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800">
                <strong>Note:</strong> Some email clients block images by default. 
                Make sure to "Show images" in your email to trigger the tracking pixel.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}