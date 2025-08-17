// src/app/test-tracking/page.tsx - FIXED WITH REAL VALIDATION ONLY
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { validateEmailOpen, getTrackingStats, getContacts, testEmailTracking } from '@/app/actions';
import { 
  Loader2, 
  Eye, 
  Send, 
  TestTube, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Activity, 
  Zap,
  Timer,
  Target,
  Database,
  Home,
  Copy,
  Info
} from 'lucide-react';
import Link from 'next/link';

interface ValidationResult {
  success: boolean;
  opened: boolean;
  timestamp: string | null;
  message: string;
  contactExists: boolean;
  wasEmailSent: boolean;
  exactOpenTime?: string;
  contactDetails?: {
    id: string;
    email: string;
    name: string;
    status: string;
  };
}

interface TrackingStats {
  totalSent: number;
  totalOpened: number;
  openRate: number;
  recentOpens: number;
  lastOpen: string | null;
  contacts: any[];
  liveOpens?: number;
  veryRecentOpens?: number;
  exactTiming?: {
    lastOpenTime: string | null;
    timeAgo: string | null;
  };
}

export default function TestTrackingPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [testContactId, setTestContactId] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('Loading...');
  const [pageLoaded, setPageLoaded] = useState(false);

  // Load real-time tracking stats with enhanced error handling
  const loadStats = async () => {
    try {
      console.log('🔄 Loading REAL tracking stats...');
      const [trackingStats, contactsList] = await Promise.all([
        getTrackingStats(),
        getContacts()
      ]);
      
      setStats(trackingStats);
      setContacts(contactsList);
      setLastUpdated(new Date().toLocaleString());
      
      console.log('📊 Real stats loaded:', {
        totalSent: trackingStats.totalSent,
        totalOpened: trackingStats.totalOpened,
        contactsCount: contactsList.length,
        liveOpens: trackingStats.liveOpens || 0
      });
    } catch (error) {
      console.error('❌ Error loading stats:', error);
      setStats({
        totalSent: 0,
        totalOpened: 0,
        openRate: 0,
        recentOpens: 0,
        lastOpen: null,
        contacts: []
      });
    }
  };

  // Initialize page with real data
  useEffect(() => {
    console.log('🔄 Test tracking page initializing with REAL validation...');
    loadStats().then(() => {
      setPageLoaded(true);
      console.log('✅ Test tracking page loaded with real data');
    });
  }, []);

  // Ultra-fast auto-refresh for real-time tracking (2 seconds)
  useEffect(() => {
    if (!pageLoaded) return;
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        console.log('🔄 Ultra-fast refresh: checking for REAL opens...');
        loadStats();
      }, 2000); // 2 seconds for near real-time
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, pageLoaded]);

  // 🔥 FIXED: Real validation test - NO FALSE POSITIVES
  const performRealValidation = async () => {
    if (!testContactId.trim()) {
      setValidationResult({
        success: false,
        opened: false,
        timestamp: null,
        message: 'Please enter a contact ID to validate',
        contactExists: false,
        wasEmailSent: false
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);
    setTestResult(null);

    try {
      console.log(`🔍 REAL VALIDATION: Checking contact ${testContactId} for ACTUAL email open status...`);
      
      // ✅ CRITICAL: Only check real status, never modify
      const validation = await validateEmailOpen(testContactId.trim());
      setValidationResult(validation);
      
      // Set test result based on REAL validation
      const resultMessage = validation.opened 
        ? `✅ CONFIRMED: Email was ACTUALLY opened by ${validation.contactDetails?.name || 'contact'}`
        : validation.wasEmailSent 
          ? `📨 Email sent but NOT OPENED YET by ${validation.contactDetails?.name || 'contact'}`
          : validation.contactExists
            ? `📤 Email not sent yet to ${validation.contactDetails?.name || 'contact'}`
            : `❌ Contact not found`;

      setTestResult({
        success: validation.success,
        message: `Real Validation: ${resultMessage}`,
        timestamp: new Date().toLocaleString(),
        type: 'real_validation',
        realOpen: validation.opened,
        contactExists: validation.contactExists
      });
      
      console.log('✅ REAL validation completed:', validation);
      
      // Refresh stats to show any real changes
      setTimeout(() => loadStats(), 500);
      
    } catch (error) {
      console.error('❌ Real validation error:', error);
      setValidationResult({
        success: false,
        opened: false,
        timestamp: null,
        message: `Validation error: ${error.message}`,
        contactExists: false,
        wasEmailSent: false
      });
    } finally {
      setIsValidating(false);
    }
  };

  // 🔥 FIXED: Automatic tracking test - REAL VALIDATION ONLY
  const runTrackingTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    setValidationResult(null);
    
    try {
      console.log('🧪 Running REAL tracking test - no fake updates...');
      
      // ✅ CRITICAL: Only test real email status, never create fake opens
      const result = await testEmailTracking();
      
      setTestResult({
        ...result,
        timestamp: new Date().toLocaleString(),
        type: 'real_auto_test'
      });
      
      // If we got a valid contact, perform real validation
      if (result.contactId && result.success) {
        console.log(`🔍 Validating real status for contact ${result.contactId}...`);
        const validation = await validateEmailOpen(result.contactId);
        setValidationResult(validation);
      }
      
      // Refresh stats to show any real changes
      setTimeout(() => loadStats(), 500);
      
    } catch (error) {
      console.error('❌ Real test error:', error);
      setTestResult({
        success: false,
        message: `Real test failed: ${error.message}`,
        timestamp: new Date().toLocaleString(),
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test tracking endpoint connectivity
  const testTrackingEndpoint = async () => {
    try {
      const contactId = testContactId || 'test-endpoint-123';
      console.log(`🧪 Testing tracking endpoint connectivity with: ${contactId}`);
      
      setTestResult({
        success: false,
        message: 'Testing tracking endpoint connectivity...',
        timestamp: new Date().toLocaleString(),
        type: 'endpoint_test'
      });
      
      const img = new Image();
      const testPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Endpoint connectivity failed'));
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
      
      // Test endpoint with special test parameter
      img.src = `/api/track/${contactId}?test=1&endpoint_test=1&t=${Date.now()}`;
      
      try {
        await testPromise;
        setTestResult({
          success: true,
          message: `✅ Tracking endpoint is working (tested with ${contactId})`,
          timestamp: new Date().toLocaleString(),
          type: 'endpoint_test'
        });
      } catch (testError) {
        setTestResult({
          success: false,
          message: `❌ Endpoint test failed: ${testError.message}`,
          timestamp: new Date().toLocaleString(),
          type: 'endpoint_test'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Endpoint test error: ' + error.message,
        timestamp: new Date().toLocaleString(),
        type: 'error'
      });
    }
  };

  // Copy contact ID to clipboard
  const copyContactId = (contactId: string) => {
    navigator.clipboard.writeText(contactId);
    // You could add a toast notification here
  };

  const sentContacts = contacts.filter(c => c.status === 'Sent' || c.status === 'Opened');
  const openedContacts = contacts.filter(c => c.status === 'Opened');
  
  // Calculate live indicators with exact timing
  const now = Date.now();
  const liveOpens = contacts.filter(c => 
    c.openTimestamp && 
    new Date(c.openTimestamp).getTime() > (now - 10000) // Last 10 seconds
  );

  const veryRecentOpens = contacts.filter(c => 
    c.openTimestamp && 
    new Date(c.openTimestamp).getTime() > (now - 30000) // Last 30 seconds
  );

  // Helper function to format exact timestamps with precision
  const formatExactTime = (timestamp: string | null) => {
    if (!timestamp) return 'No timestamp';
    
    const date = new Date(timestamp);
    const diffMs = now - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    
    if (diffSeconds < 5) {
      return (
        <span className="text-red-600 font-bold animate-pulse">
          <Zap className="w-3 h-3 inline mr-1" />
          Just now! ({date.toLocaleTimeString()})
        </span>
      );
    } else if (diffSeconds < 60) {
      return (
        <span className="text-orange-600 font-bold">
          {diffSeconds}s ago ({date.toLocaleTimeString()})
        </span>
      );
    } else if (diffMinutes < 60) {
      return (
        <span className="text-green-600 font-medium">
          {diffMinutes}m ago ({date.toLocaleTimeString()})
        </span>
      );
    } else {
      return (
        <span className="text-gray-600">
          {date.toLocaleString()}
        </span>
      );
    }
  };

  if (!pageLoaded) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Loading REAL Tracking Validation...</h2>
            <p className="text-gray-500">Initializing real-time email tracking system</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🔥 REAL Email Tracking Validation</h1>
          <p className="text-gray-600">Test and validate ACTUAL email tracking - no fake data, only real opens!</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            <Button variant="outline" size="sm">
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Button 
            onClick={loadStats} 
            variant="outline" 
            size="sm"
            disabled={isLoading || isValidating}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            {autoRefresh ? '⏸️ Pause' : '▶️ Resume'}
          </Button>
        </div>
      </div>
      
      {/* Real-time Status with Enhanced Indicators */}
      <Card className={`border-2 ${autoRefresh ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`}></div>
              <span className={`font-medium ${
                autoRefresh ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {autoRefresh 
                  ? '🔴 LIVE: Real validation active (2s ultra-fast refresh)' 
                  : '⏸️ Auto-refresh paused'
                }
              </span>
              {liveOpens.length > 0 && (
                <Badge className="bg-red-500 text-white animate-bounce">
                  <Zap className="w-3 h-3 mr-1" />
                  {liveOpens.length} LIVE NOW!
                </Badge>
              )}
              {veryRecentOpens.length > 0 && liveOpens.length === 0 && (
                <Badge className="bg-orange-500 text-white animate-pulse">
                  <Timer className="w-3 h-3 mr-1" />
                  {veryRecentOpens.length} Very Recent
                </Badge>
              )}
            </div>
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated}
            </span>
          </div>
          
          {/* Real-time Statistics */}
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="text-center">
              <p className="font-bold text-lg text-blue-600">{stats?.totalSent || 0}</p>
              <p className="text-gray-600">Emails Sent</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-green-600">{stats?.totalOpened || 0}</p>
              <p className="text-gray-600">Actually Opened</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-purple-600">{stats?.openRate || 0}%</p>
              <p className="text-gray-600">Real Open Rate</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-orange-600">{liveOpens.length}</p>
              <p className="text-gray-600">Live Opens</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Validation Controls - Real Testing Only */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Auto Test - Real Validation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Automatic Real Validation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium mb-1">
                ✅ REAL VALIDATION ONLY
              </p>
              <p className="text-xs text-blue-700">
                This test finds actually sent emails and checks their REAL open status. 
                No fake data is created - only genuine email opens are detected.
              </p>
            </div>
            <Button onClick={runTrackingTest} disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Validating Real Status...' : 'Run Real Validation Test'}
            </Button>
          </CardContent>
        </Card>

        {/* Manual Validation - By Contact ID */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Manual Contact Validation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contactId">Contact ID</Label>
              <Input
                id="contactId"
                value={testContactId}
                onChange={(e) => setTestContactId(e.target.value)}
                placeholder="Enter contact ID to validate (e.g., 1, 2, 3...)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use IDs from the contact list below or your dashboard
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={performRealValidation} 
                disabled={isValidating || !testContactId.trim()}
                className="flex-1"
              >
                {isValidating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                {isValidating ? 'Checking Real Status...' : 'Check Real Status'}
              </Button>
              <Button 
                onClick={testTrackingEndpoint} 
                variant="outline"
                disabled={isLoading || isValidating}
              >
                <TestTube className="w-4 h-4 mr-2" />
                Test Endpoint
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real Validation Results */}
      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle>📊 REAL Email Validation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-md border ${
              validationResult.success
                ? validationResult.opened 
                  ? 'bg-green-50 border-green-200' 
                  : validationResult.wasEmailSent
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-2">
                {validationResult.success ? (
                  validationResult.opened ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : validationResult.wasEmailSent ? (
                    <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                  ) : (
                    <Send className="w-5 h-5 text-blue-600 mt-0.5" />
                  )
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    validationResult.success
                      ? validationResult.opened 
                        ? 'text-green-800' 
                        : validationResult.wasEmailSent
                          ? 'text-yellow-800'
                          : 'text-blue-800'
                      : 'text-red-800'
                  }`}>
                    {validationResult.message}
                  </p>
                  
                  {/* Enhanced Status Badges */}
                  <div className="flex gap-2 mt-3">
                    <Badge variant={validationResult.contactExists ? "default" : "destructive"}>
                      Contact: {validationResult.contactExists ? "✅ Found" : "❌ Not Found"}
                    </Badge>
                    <Badge variant={validationResult.wasEmailSent ? "default" : "secondary"}>
                      Email: {validationResult.wasEmailSent ? "📤 Sent" : "⏳ Not Sent"}
                    </Badge>
                    <Badge variant={validationResult.opened ? "default" : "outline"}>
                      Status: {validationResult.opened ? "👀 OPENED" : "📭 Not Opened"}
                    </Badge>
                  </div>
                  
                  {/* Contact Details */}
                  {validationResult.contactDetails && (
                    <div className="mt-3 p-2 bg-white rounded border">
                      <p className="text-sm font-medium text-gray-700">Contact Details:</p>
                      <div className="text-xs text-gray-600 mt-1 space-y-1">
                        <p>📧 {validationResult.contactDetails.email}</p>
                        <p>👤 {validationResult.contactDetails.name}</p>
                        <p>🆔 ID: {validationResult.contactDetails.id}</p>
                        <p>📊 Status: {validationResult.contactDetails.status}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Exact Open Time */}
                  {validationResult.opened && validationResult.exactOpenTime && (
                    <div className="mt-3 p-3 bg-white rounded border border-green-300">
                      <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                        <Timer className="w-4 h-4" />
                        EXACT Open Time:
                      </p>
                      <p className="text-sm font-mono mt-1">
                        {formatExactTime(validationResult.exactOpenTime)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>🧪 Real Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-md border ${
              testResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {testResult.message}
                  </p>
                  {testResult.contactEmail && (
                    <p className="text-sm mt-1 text-gray-600">
                      📧 Contact: {testResult.contactEmail}
                    </p>
                  )}
                  {testResult.contactId && (
                    <p className="text-sm mt-1 text-gray-600">
                      🆔 Contact ID: {testResult.contactId}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {typeof testResult.realOpen === 'boolean' && (
                      <Badge variant={testResult.realOpen ? "default" : "outline"}>
                        {testResult.realOpen ? "✅ Actually Opened" : "📭 Not Opened Yet"}
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      Type: {testResult.type}
                    </Badge>
                  </div>
                  <p className="text-xs mt-2 text-gray-500">
                    Test performed: {testResult.timestamp}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Contact Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-time Email Activity
            {liveOpens.length > 0 && (
              <Badge className="bg-red-500 text-white animate-pulse">
                🔥 {liveOpens.length} LIVE
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sentContacts.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No sent emails found</p>
              <p className="text-sm text-gray-400">Send some emails to see real-time tracking data</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sentContacts
                .sort((a, b) => {
                  const aTime = a.openTimestamp || a.sentTimestamp || '';
                  const bTime = b.openTimestamp || b.sentTimestamp || '';
                  return new Date(bTime).getTime() - new Date(aTime).getTime();
                })
                .slice(0, 15)
                .map(contact => {
                  const isLive = contact.openTimestamp && 
                    new Date(contact.openTimestamp).getTime() > (now - 10000);
                  const isVeryRecent = contact.openTimestamp && 
                    new Date(contact.openTimestamp).getTime() > (now - 30000);
                  
                  return (
                    <div key={contact.id} className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      isLive 
                        ? 'bg-red-100 border-2 border-red-300 animate-pulse' 
                        : isVeryRecent
                          ? 'bg-orange-100 border-2 border-orange-300'
                          : contact.status === 'Opened'
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <div>
                        <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                        <p className="text-sm text-gray-600">{contact.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">ID: {contact.id}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={() => copyContactId(contact.id)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={contact.status === 'Opened' ? 'default' : 'secondary'} 
                          className={isLive ? 'animate-bounce bg-red-500 text-white' : ''}
                        >
                          {contact.status === 'Opened' ? (
                            <Eye className="w-3 h-3 mr-1" />
                          ) : (
                            <Send className="w-3 h-3 mr-1" />
                          )}
                          {isLive ? '🔥 LIVE OPEN!' : contact.status}
                        </Badge>
                        
                        {contact.openTimestamp && (
                          <p className={`text-xs mt-1 ${
                            isLive ? 'text-red-700 font-bold' : 'text-green-600'
                          }`}>
                            📅 {formatExactTime(contact.openTimestamp)}
                          </p>
                        )}
                        
                        {contact.sentTimestamp && !contact.openTimestamp && (
                          <p className="text-xs mt-1 text-blue-600">
                            📤 Sent: {new Date(contact.sentTimestamp).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Real Validation Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Page Status:</strong> ✅ Loaded with Real Data</p>
              <p><strong>Validation Mode:</strong> 🔥 Real-time Only (No Fake Data)</p>
              <p><strong>Auto-refresh:</strong> {autoRefresh ? '🔴 Active (2s ultra-fast)' : '⏸️ Paused'}</p>
              <p><strong>Total Contacts:</strong> {contacts.length}</p>
              <p><strong>Sent Emails:</strong> {sentContacts.length}</p>
            </div>
            <div>
              <p><strong>Actually Opened:</strong> {openedContacts.length}</p>
              <p><strong>Live Opens (10s):</strong> {liveOpens.length}</p>
              <p><strong>Very Recent (30s):</strong> {veryRecentOpens.length}</p>
              <p><strong>Last Updated:</strong> {lastUpdated}</p>
              <p><strong>Last Real Open:</strong> {stats?.exactTiming?.timeAgo || 'None'}</p>
            </div>
          </div>
          
          {/* Available Test Contacts */}
          {sentContacts.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">✅ Available for Real Testing:</p>
              <div className="text-xs text-blue-700 space-y-1 max-h-32 overflow-y-auto">
                {sentContacts.slice(0, 5).map(contact => (
                  <div key={contact.id} className="flex items-center justify-between">
                    <span>
                      ID: <code className="bg-white px-1 rounded font-mono">{contact.id}</code> | 
                      {contact.email} | 
                      Status: <strong>{contact.status}</strong>
                      {contact.openTimestamp && (
                        <span className="text-green-700"> | Opened: {new Date(contact.openTimestamp).toLocaleString()}</span>
                      )}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 ml-2"
                      onClick={() => setTestContactId(contact.id)}
                    >
                      Use ID
                    </Button>
                  </div>
                ))}
                {sentContacts.length > 5 && (
                  <p>...and {sentContacts.length - 5} more</p>
                )}
              </div>
            </div>
          )}
          
          {/* Real Validation Notice */}
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium">Real Validation Mode Active</p>
                <p className="text-xs mt-1">
                  This system only detects genuine email opens. No fake data is generated. 
                  All timestamps are exact and all status updates are based on real user actions.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}