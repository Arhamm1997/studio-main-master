// src/components/TrackingDebug.tsx - ENHANCED WITH REAL VALIDATION
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateEmailOpen, getTrackingStats } from '@/app/actions';
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
  Database
} from 'lucide-react';

interface TrackingDebugProps {
  settings: any;
  contacts: any[];
}

interface ValidationResult {
  success: boolean;
  opened: boolean;
  timestamp: string | null;
  message: string;
  contactExists: boolean;
  wasEmailSent: boolean;
}

interface TrackingStats {
  totalSent: number;
  totalOpened: number;
  openRate: number;
  recentOpens: number;
  lastOpen: string | null;
  contacts: any[];
}

export default function TrackingDebug({ settings, contacts }: TrackingDebugProps) {
  const [testResult, setTestResult] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [testContactId, setTestContactId] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  // Load real-time tracking stats
  const loadStats = async () => {
    try {
      const trackingStats = await getTrackingStats();
      setStats(trackingStats);
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error('Error loading tracking stats:', error);
    }
  };

  // Auto-refresh every 3 seconds
  useEffect(() => {
    loadStats();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        console.log('🔄 TrackingDebug: Auto-refreshing stats...');
        loadStats();
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // FIXED: Real validation test (doesn't fake anything)
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
    setTestResult('');

    try {
      console.log(`🔍 Performing REAL validation for contact: ${testContactId}`);
      
      // IMPORTANT: This only validates existing status, never changes it
      const validation = await validateEmailOpen(testContactId.trim());
      setValidationResult(validation);
      
      // Set test result based on validation
      setTestResult(validation.success 
        ? `✅ Validation successful: ${validation.message}`
        : `❌ Validation failed: ${validation.message}`
      );
      
      console.log('✅ Real validation completed:', validation);
      
      // Refresh stats after validation
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
      setTestResult(`❌ Validation failed: ${error.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  // FIXED: Test tracking endpoint (uses test flag, doesn't affect real data)
  const testTrackingEndpoint = async () => {
    setIsLoading(true);
    setTestResult('');
    
    try {
      const contactId = testContactId || 'test-endpoint-validation';
      console.log(`🧪 Testing tracking endpoint with test flag: ${contactId}`);
      
      setTestResult('Testing tracking endpoint...');
      
      // Create test request to tracking endpoint WITH test flag
      const img = new Image();
      
      const testPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => {
          console.log('✅ Tracking endpoint responded successfully');
          resolve();
        };
        img.onerror = () => {
          console.log('❌ Tracking endpoint failed');
          reject(new Error('Tracking endpoint failed to respond'));
        };
        
        setTimeout(() => {
          reject(new Error('Tracking endpoint test timed out'));
        }, 5000);
      });
      
      // Send request with test flag to prevent affecting real data
      const timestamp = Date.now();
      img.src = `/api/track/${contactId}?test=1&debug=1&t=${timestamp}`;
      
      try {
        await testPromise;
        setTestResult(`✅ Tracking endpoint working correctly (test mode used)`);
        console.log('✅ Endpoint test completed successfully');
      } catch (testError) {
        setTestResult(`❌ Endpoint test failed: ${testError.message}`);
        console.error('❌ Endpoint test failed:', testError);
      }
      
    } catch (error) {
      setTestResult(`❌ Error testing endpoint: ${error.message}`);
      console.error('❌ Endpoint test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sentContacts = contacts.filter(c => c.status === 'Sent' || c.status === 'Opened');
  const openedContacts = contacts.filter(c => c.status === 'Opened');
  
  // Calculate live indicators
  const now = Date.now();
  const liveOpens = contacts.filter(c => 
    c.openTimestamp && 
    new Date(c.openTimestamp).getTime() > (now - 30000) // Last 30 seconds
  );

  // Helper function to format exact timestamps
  const formatExactTime = (timestamp: string | null) => {
    if (!timestamp) return 'No timestamp';
    
    const date = new Date(timestamp);
    const diffMs = now - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) {
      return `Just now (${date.toLocaleTimeString()})`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago (${date.toLocaleTimeString()})`;
    } else {
      return date.toLocaleString();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Enhanced Email Tracking Debug & Validation
          {liveOpens.length > 0 && (
            <Badge className="bg-red-500 text-white animate-pulse">
              🔥 {liveOpens.length} LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Real-time Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Real-time Tracking Status
            </h4>
            <div className="flex items-center gap-2">
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
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-600">Emails Sent</p>
              <p className="text-xl font-bold text-blue-800">{stats?.totalSent || sentContacts.length}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-md">
              <p className="text-sm text-green-600">Emails Opened</p>
              <p className="text-xl font-bold text-green-800">{stats?.totalOpened || openedContacts.length}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-md">
              <p className="text-sm text-purple-600">Open Rate</p>
              <p className="text-xl font-bold text-purple-800">{stats?.openRate || 0}%</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-md">
              <p className="text-sm text-orange-600">Recent Opens</p>
              <p className="text-xl font-bold text-orange-800">{stats?.recentOpens || 0}</p>
            </div>
          </div>
          
          <div className={`p-3 rounded-md border ${
            autoRefresh 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`}></div>
              <span className={`text-sm font-medium ${
                autoRefresh ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {autoRefresh 
                  ? '🔴 LIVE: Auto-refresh active (3s)' 
                  : '⏸️ Auto-refresh paused'
                }
              </span>
              <span className="text-xs text-gray-500 ml-auto">
                Last updated: {lastUpdated}
              </span>
            </div>
          </div>
        </div>

        {/* Tracking Configuration */}
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <Database className="w-4 h-4" />
            Tracking Configuration
          </h4>
          <div className="flex gap-2">
            <Badge variant={settings.realtimeTracking ? "default" : "destructive"}>
              Real-time Tracking: {settings.realtimeTracking ? 'ON' : 'OFF'}
            </Badge>
            <Badge variant="outline">
              Exact Timestamps: Enabled
            </Badge>
            <Badge variant="outline">
              Auto-validation: Active
            </Badge>
          </div>
          
          {!settings.realtimeTracking && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">
                ⚠️ Real-time tracking is disabled. Enable it in Settings to track email opens with exact timestamps.
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Validation Controls */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            Real Email Validation (No Fake Updates)
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Manual Contact Validation */}
            <div className="p-4 border rounded-lg">
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Manual Contact Validation
              </h5>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="contactId">Contact ID</Label>
                  <Input
                    id="contactId"
                    value={testContactId}
                    onChange={(e) => setTestContactId(e.target.value)}
                    placeholder="Enter contact ID to validate real status"
                  />
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
                    {isValidating ? 'Validating...' : 'Validate Real Status'}
                  </Button>
                  <Button 
                    onClick={testTrackingEndpoint} 
                    disabled={isLoading}
                    variant="outline"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4 mr-2" />
                    )}
                    Test Endpoint
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  ✅ Only validates existing status - never changes or fakes email opens
                </p>
              </div>
            </div>

            {/* Available Test Contacts */}
            <div className="p-4 border rounded-lg">
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Available for Testing
              </h5>
              {sentContacts.length === 0 ? (
                <p className="text-sm text-gray-500">No sent emails available for testing</p>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {sentContacts.slice(0, 3).map(contact => (
                    <div key={contact.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                        <p className="text-gray-500">ID: {contact.id}</p>
                      </div>
                      <Badge 
                        variant={contact.status === 'Opened' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {contact.status}
                      </Badge>
                    </div>
                  ))}
                  {sentContacts.length > 3 && (
                    <p className="text-xs text-gray-500">...and {sentContacts.length - 3} more</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Validation Results */}
        {validationResult && (
          <div className="space-y-2">
            <h4 className="font-semibold">📊 Real Validation Results</h4>
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
                  
                  {/* Status indicators */}
                  <div className="flex gap-2 mt-2">
                    <Badge variant={validationResult.contactExists ? "default" : "destructive"}>
                      Contact: {validationResult.contactExists ? "Found" : "Not Found"}
                    </Badge>
                    <Badge variant={validationResult.wasEmailSent ? "default" : "secondary"}>
                      Email: {validationResult.wasEmailSent ? "Sent" : "Not Sent"}
                    </Badge>
                    <Badge variant={validationResult.opened ? "default" : "outline"}>
                      Status: {validationResult.opened ? "Actually Opened" : "Not Opened Yet"}
                    </Badge>
                  </div>
                  
                  {validationResult.opened && validationResult.timestamp && (
                    <div className="mt-2 p-2 bg-white rounded border">
                      <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        Exact Open Time: {formatExactTime(validationResult.timestamp)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Raw timestamp: {validationResult.timestamp}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResult && (
          <div className="space-y-2">
            <h4 className="font-semibold">🧪 Test Results</h4>
            <div className={`p-3 rounded-md border ${
              testResult.includes('✅') 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm ${
                testResult.includes('✅') ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult}
              </p>
            </div>
          </div>
        )}

        {/* Recent Opens Activity */}
        {openedContacts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Recent Email Opens
              {liveOpens.length > 0 && (
                <Badge className="bg-red-500 text-white animate-pulse">
                  {liveOpens.length} LIVE
                </Badge>
              )}
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {openedContacts
                .sort((a, b) => {
                  const aTime = a.openTimestamp || '';
                  const bTime = b.openTimestamp || '';
                  return new Date(bTime).getTime() - new Date(aTime).getTime();
                })
                .slice(0, 5)
                .map(contact => {
                  const isLive = contact.openTimestamp && 
                    new Date(contact.openTimestamp).getTime() > (now - 30000);
                  
                  return (
                    <div key={contact.id} className={`text-sm p-3 rounded transition-all ${
                      isLive 
                        ? 'bg-red-50 border-2 border-red-200 animate-pulse' 
                        : 'bg-green-50 border border-green-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{contact.firstName} {contact.lastName}</span>
                        <Badge className={isLive ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}>
                          {isLive ? '🔥 LIVE OPEN' : 'Opened'}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{contact.email}</p>
                      <p className={`text-xs mt-1 ${isLive ? 'text-red-700 font-bold' : 'text-green-600'}`}>
                        <Timer className="w-3 h-3 inline mr-1" />
                        {formatExactTime(contact.openTimestamp)}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Enhanced Debug Information */}
        <div className="space-y-2">
          <h4 className="font-semibold">🔧 Enhanced Debug Information</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p><strong>Tracking Mode:</strong> Real-time Only</p>
              <p><strong>Validation:</strong> No Fake Updates</p>
              <p><strong>Timestamps:</strong> Exact (ISO format)</p>
              <p><strong>Auto-refresh:</strong> {autoRefresh ? '3s intervals' : 'Paused'}</p>
            </div>
            <div className="space-y-1">
              <p><strong>Total Contacts:</strong> {contacts.length}</p>
              <p><strong>Sent Emails:</strong> {sentContacts.length}</p>
              <p><strong>Opened Emails:</strong> {openedContacts.length}</p>
              <p><strong>Live Opens:</strong> {liveOpens.length}</p>
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-1">Tracking URL Format:</p>
            <code className="text-xs bg-white p-2 rounded block text-blue-700">
              {process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/track/[contactId]
            </code>
            <p className="text-xs text-blue-600 mt-1">
              Real opens are tracked automatically with exact timestamps
            </p>
          </div>
          
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 mb-1">⚠️ Validation Notes:</p>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• This component only validates REAL email open status</li>
              <li>• No fake or simulated opens are created</li>
              <li>• Test endpoint uses test flag to avoid affecting real data</li>
              <li>• Exact timestamps are preserved and displayed</li>
              <li>• Live indicators show opens within last 30 seconds</li>
            </ul>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}