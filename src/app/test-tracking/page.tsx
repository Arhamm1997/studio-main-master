// app/test-tracking/page.tsx - Fixed version
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { testEmailTracking, getTrackingStats } from '@/app/actions';

export default function TrackingTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const trackingStats = await getTrackingStats();
      setStats(trackingStats);
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({
        totalSent: 0,
        totalOpened: 0,
        openRate: 0,
        recentOpens: 0,
        last24Hours: []
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const runTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    try {
      const result = await testEmailTracking();
      setTestResult(result);
      // Reload stats after test
      if (result.success) {
        setTimeout(() => loadStats(), 1000);
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Error: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testTrackingEndpoint = async () => {
    setIsLoading(true);
    try {
      // Test the tracking endpoint directly
      const response = await fetch('/api/track/test-123', {
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        alert('✅ Tracking endpoint is working! Check the browser network tab to see the tracking pixel response.');
      } else {
        alert(`❌ Tracking endpoint failed with status: ${response.status}`);
      }
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testBackendConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:9000/api/health');
      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ Backend is working!\nStatus: ${data.status}\nEmail Service: ${data.emailService?.status || 'unknown'}`);
      } else {
        alert('❌ Backend health check failed');
      }
    } catch (error: any) {
      alert('❌ Cannot connect to backend: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold tracking-tight">📧 Email Tracking Test</h1>
      </div>
      
      {/* Current Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Current Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <div className="text-center py-4">Loading stats...</div>
          ) : stats ? (
            <>
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
              
              {stats.last24Hours && stats.last24Hours.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Recent Opens (Last 24h):</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {stats.last24Hours.slice(0, 5).map((open: any, index: number) => (
                      <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                        <span className="font-medium">{open.email}</span>
                        <span className="text-gray-500 ml-2">
                          {open.openedAt ? new Date(open.openedAt).toLocaleString() : 'No timestamp'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-gray-500">No stats available</div>
          )}
        </CardContent>
      </Card>

      {/* Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={runTest} 
              disabled={isLoading}
              className="min-w-[200px]"
            >
              {isLoading ? 'Testing...' : 'Test Email Open Simulation'}
            </Button>
            
            <Button 
              onClick={testTrackingEndpoint} 
              disabled={isLoading}
              variant="outline"
              className="min-w-[200px]"
            >
              {isLoading ? 'Testing...' : 'Test Tracking Endpoint'}
            </Button>
            
            <Button 
              onClick={testBackendConnection} 
              disabled={isLoading}
              variant="outline"
              className="min-w-[200px]"
            >
              {isLoading ? 'Testing...' : 'Test Backend Connection'}
            </Button>
            
            <Button 
              onClick={loadStats} 
              disabled={isLoadingStats}
              variant="outline"
              className="min-w-[200px]"
            >
              {isLoadingStats ? 'Loading...' : 'Refresh Stats'}
            </Button>
          </div>
        </CardContent>
      </Card>

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
              {testResult.error && (
                <p className="text-sm mt-2 text-red-600">
                  Error Details: {testResult.error}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Test Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">To manually test email tracking:</h4>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Go to the Dashboard and send a test email to yourself</li>
                <li>Open the email in your email client (Gmail, Outlook, etc.)</li>
                <li>Make sure to "Show images" in your email</li>
                <li>Wait a few seconds for the tracking pixel to load</li>
                <li>Come back here and click "Refresh Stats"</li>
                <li>Check the dashboard - the status should change to "Opened"</li>
              </ol>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-semibold text-blue-800 mb-2">Important Notes:</h4>
              <ul className="text-blue-800 space-y-1">
                <li>• Some email clients block images by default</li>
                <li>• Make sure to "Show images" to trigger the tracking pixel</li>
                <li>• The tracking URL format is: <code className="bg-white px-1 rounded">/api/track/[contactId]</code></li>
                <li>• Check the browser Network tab to see tracking requests</li>
              </ul>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="font-semibold text-yellow-800 mb-2">Troubleshooting:</h4>
              <ul className="text-yellow-800 space-y-1">
                <li>• If tracking doesn't work, check the backend is running on port 9000</li>
                <li>• Make sure CORS is configured correctly</li>
                <li>• Check browser console for any errors</li>
                <li>• Test the tracking endpoint directly using the button above</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracking URL Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Tracking URL Format:</h4>
              <code className="text-xs bg-gray-100 p-2 rounded block">
                {typeof window !== 'undefined' 
                  ? `${window.location.origin}/api/track/[contactId]` 
                  : 'http://localhost:9002/api/track/[contactId]'
                }
              </code>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Test URLs:</h4>
              <div className="space-y-1">
                <div>
                  <span className="text-sm font-medium">Frontend Tracking: </span>
                  <code className="text-xs bg-gray-100 p-1 rounded">
                    {typeof window !== 'undefined' 
                      ? `${window.location.origin}/api/track/test-123` 
                      : 'http://localhost:9002/api/track/test-123'
                    }
                  </code>
                </div>
                <div>
                  <span className="text-sm font-medium">Backend Health: </span>
                  <code className="text-xs bg-gray-100 p-1 rounded">
                    http://localhost:9000/api/health
                  </code>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Expected Response:</h4>
              <p className="text-sm text-gray-600">
                The tracking endpoint should return a 1x1 transparent PNG image with appropriate headers.
                Check the Network tab in your browser to see the actual response.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}