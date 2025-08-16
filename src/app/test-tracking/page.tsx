// app/test-tracking/page.tsx - INSTANT LOADING TEST PAGE
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { testEmailTracking, getTrackingStats, getContacts } from '@/app/actions';
import { Loader2, Eye, Send, TestTube, CheckCircle2, XCircle, Trash2, RefreshCw, Activity } from 'lucide-react';

export default function TrackingTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testContactId, setTestContactId] = useState('');
  const [lastUpdated, setLastUpdated] = useState('Loading...');
  const [dataLoaded, setDataLoaded] = useState(false);

  const loadData = async () => {
    try {
      const [trackingStats, contactsList] = await Promise.all([
        getTrackingStats(),
        getContacts()
      ]);
      setStats(trackingStats);
      setContacts(contactsList);
      setLastUpdated(new Date().toLocaleString());
      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading data:', error);
      setDataLoaded(true); // Still mark as loaded even if error
    }
  };

  // Load data immediately on mount
  useEffect(() => {
    loadData();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const runTrackingTest = async () => {
    setIsLoading(true);
    try {
      const result = await testEmailTracking();
      setTestResult({
        ...result,
        timestamp: new Date().toLocaleString()
      });
      // Reload data after test
      setTimeout(() => loadData(), 1000);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error.message}`,
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testTrackingEndpoint = async () => {
    try {
      const contactId = testContactId || 'test-123';
      console.log(`Testing tracking endpoint with contact ID: ${contactId}`);
      
      // Create a test image element to trigger the tracking pixel
      const img = new Image();
      img.onload = () => {
        console.log('✅ Tracking pixel loaded successfully');
        setTestResult({
          success: true,
          message: `Tracking endpoint test successful for contact ${contactId}`,
          timestamp: new Date().toLocaleString()
        });
        // Reload data after successful test
        setTimeout(() => loadData(), 1000);
      };
      img.onerror = () => {
        console.log('❌ Tracking pixel failed to load');
        setTestResult({
          success: false,
          message: `Tracking endpoint test failed for contact ${contactId}`,
          timestamp: new Date().toLocaleString()
        });
      };
      
      // Trigger the tracking pixel with cache busting
      const timestamp = Date.now();
      img.src = `/api/track/${contactId}?test=1&t=${timestamp}`;
      
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Error: ' + error.message,
        timestamp: new Date().toLocaleString()
      });
    }
  };

  const sentContacts = contacts.filter(c => c.status === 'Sent' || c.status === 'Opened');
  const openedContacts = contacts.filter(c => c.status === 'Opened');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📧 Email Tracking Test & Debug</h1>
        <Button onClick={loadData} variant="outline" disabled={!dataLoaded}>
          <RefreshCw className={`w-4 h-4 mr-2 ${!dataLoaded ? 'animate-spin' : ''}`} />
          {dataLoaded ? 'Refresh Now' : 'Loading...'}
        </Button>
      </div>
      
      {/* Real-time Status Indicator */}
      <Card className={`border-2 ${dataLoaded ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${dataLoaded ? 'bg-green-500 animate-pulse' : 'bg-blue-500 animate-spin'}`}></div>
              <span className={`font-medium ${dataLoaded ? 'text-green-800' : 'text-blue-800'}`}>
                {dataLoaded ? 'Real-time Tracking Active' : 'Loading Tracking Data...'}
              </span>
            </div>
            <span className={`text-sm ${dataLoaded ? 'text-green-600' : 'text-blue-600'}`}>
              Last updated: {lastUpdated}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{sentContacts.length}</p>
              <p className="text-sm text-gray-600">Emails Sent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{openedContacts.length}</p>
              <p className="text-sm text-gray-600">Emails Opened</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats?.openRate || 0}%</p>
              <p className="text-sm text-gray-600">Open Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats?.recentOpens || 0}</p>
              <p className="text-sm text-gray-600">Opens (24h)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Controls */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Automatic Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Automatic Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Automatically find a sent email and simulate opening it.
            </p>
            <Button onClick={runTrackingTest} disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Testing...' : 'Run Test'}
            </Button>
          </CardContent>
        </Card>

        {/* Manual Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Manual Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="testContactId">Contact ID</Label>
              <Input
                id="testContactId"
                value={testContactId}
                onChange={(e) => setTestContactId(e.target.value)}
                placeholder="test-123"
              />
            </div>
            <Button onClick={testTrackingEndpoint} variant="outline" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              Test Endpoint
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-md border ${
              testResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <p className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                  {testResult.message}
                </p>
              </div>
              {testResult.timestamp && (
                <p className="text-xs mt-1 text-gray-500">
                  {testResult.timestamp}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!dataLoaded ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading contacts...</span>
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No contacts found</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {contacts
                .filter(c => c.status === 'Sent' || c.status === 'Opened')
                .sort((a, b) => {
                  const aTime = a.openTimestamp || a.sentTimestamp || '';
                  const bTime = b.openTimestamp || b.sentTimestamp || '';
                  return new Date(bTime).getTime() - new Date(aTime).getTime();
                })
                .slice(0, 10)
                .map(contact => (
                  <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                      <p className="text-sm text-gray-600">{contact.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={contact.status === 'Opened' ? 'default' : 'secondary'}>
                        {contact.status === 'Opened' ? (
                          <Eye className="w-3 h-3 mr-1" />
                        ) : (
                          <Send className="w-3 h-3 mr-1" />
                        )}
                        {contact.status}
                      </Badge>
                      {contact.openTimestamp && (
                        <p className="text-xs text-green-600 mt-1">
                          {new Date(contact.openTimestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Page Status:</strong> ✅ Loaded</p>
              <p><strong>Data Status:</strong> {dataLoaded ? '✅ Ready' : '⏳ Loading'}</p>
              <p><strong>Contacts:</strong> {contacts.length}</p>
            </div>
            <div>
              <p><strong>Sent:</strong> {sentContacts.length}</p>
              <p><strong>Opened:</strong> {openedContacts.length}</p>
              <p><strong>Auto-refresh:</strong> 5s</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}