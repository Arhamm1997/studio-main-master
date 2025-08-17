// src/app/api/track/[contactId]/route.ts - FIXED WITH EXACT TIMESTAMPS
import { updateContactOpenStatus } from '@/app/actions';
import { NextRequest, NextResponse } from 'next/server';

// 1x1 transparent pixel image data (PNG format)
const TRACKING_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

// Enhanced tracking storage with precise timing
const trackingAttempts = new Map<string, {
  timestamp: string;
  userAgent: string;
  ip: string;
  referer: string;
  isTestRequest: boolean;
  isValidationRequest: boolean;
  isEndpointTest: boolean;
  realEmailOpen: boolean;
  requestId: string;
  processed: boolean;
  contactId: string;
  exactBrowserTimestamp: string;
}>();

export async function GET(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  const requestStartTime = Date.now();
  
  // 🕐 CRITICAL: Capture EXACT moment of email open
  const exactBrowserTimestamp = new Date().toISOString();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const contactId = params.contactId;
    const searchParams = request.nextUrl.searchParams;
    
    // Classify request type with precise detection
    const isTestRequest = searchParams.has('test') || searchParams.get('test') === '1';
    const isValidationRequest = searchParams.has('validation') || searchParams.get('validation') === '1';
    const isEndpointTest = searchParams.has('endpoint_test') || contactId.includes('test-endpoint');
    const sentAt = searchParams.get('sent_at'); // Original send timestamp
    
    // Extract request metadata for validation
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'Unknown';
    const referer = request.headers.get('referer') || 'Direct';
    
    // 🔥 ENHANCED LOGGING with exact timing
    console.log(`\n🔥 ===== EMAIL TRACKING REQUEST =====`);
    console.log(`🕐 EXACT OPEN TIMESTAMP: ${exactBrowserTimestamp}`);
    console.log(`🆔 Contact ID: ${contactId}`);
    console.log(`🎯 Request ID: ${requestId}`);
    console.log(`🏷️  Request Classification:`);
    console.log(`   - Test Request: ${isTestRequest ? '🧪 YES' : '❌ NO'}`);
    console.log(`   - Validation Request: ${isValidationRequest ? '🔍 YES' : '❌ NO'}`);
    console.log(`   - Endpoint Test: ${isEndpointTest ? '⚡ YES' : '❌ NO'}`);
    console.log(`   - REAL EMAIL OPEN: ${!isTestRequest && !isValidationRequest && !isEndpointTest ? '🔥 YES' : '❌ NO'}`);
    console.log(`🌐 IP: ${ip}`);
    console.log(`🔗 Referer: ${referer}`);
    console.log(`📧 Original Sent At: ${sentAt || 'Not provided'}`);
    console.log(`🖥️  User Agent: ${userAgent.substring(0, 100)}...`);
    console.log(`==========================================\n`);
    
    // Validate contact ID format and legitimacy
    if (!contactId || 
        contactId === 'undefined' || 
        contactId === 'null' || 
        contactId.length === 0 ||
        contactId.trim() === '') {
      
      console.log(`⚠️ Invalid contact ID: "${contactId}" - returning pixel without processing`);
      return new NextResponse(TRACKING_PIXEL, {
        status: 200,
        headers: getTrackingHeaders(exactBrowserTimestamp, 'invalid-contact-id'),
      });
    }

    // Store tracking attempt with comprehensive data
    const trackingData = {
      timestamp: exactBrowserTimestamp,
      userAgent,
      ip,
      referer,
      isTestRequest,
      isValidationRequest,
      isEndpointTest,
      realEmailOpen: !isTestRequest && !isValidationRequest && !isEndpointTest,
      requestId,
      processed: false,
      contactId,
      exactBrowserTimestamp
    };
    
    trackingAttempts.set(requestId, trackingData);
    
    // 🚨 CRITICAL: Only process REAL email opens
    if (!isTestRequest && !isValidationRequest && !isEndpointTest) {
      console.log(`🔥 REAL EMAIL OPEN DETECTED - Processing status update for contact ${contactId}...`);
      
      try {
        console.log(`📞 Calling updateContactOpenStatus with exact timestamp: ${exactBrowserTimestamp}`);
        
        // 🔥 CRITICAL CALL: Update contact status with exact browser timestamp
        const updateResult = await updateContactOpenStatus(contactId, exactBrowserTimestamp);
        
        if (updateResult) {
          console.log(`✅ SUCCESS: Contact ${contactId} status updated to OPENED at EXACT time ${exactBrowserTimestamp}`);
          
          // Mark as successfully processed
          trackingData.processed = true;
          trackingAttempts.set(requestId, trackingData);
          
          // Log success metrics
          console.log(`📊 Email Open Metrics:`);
          console.log(`   - Contact ID: ${contactId}`);
          console.log(`   - Exact Open Time: ${exactBrowserTimestamp}`);
          console.log(`   - Processing Time: ${Date.now() - requestStartTime}ms`);
          console.log(`   - User Agent: ${userAgent.substring(0, 50)}...`);
          console.log(`   - IP Address: ${ip}`);
          
        } else {
          console.log(`ℹ️ Contact ${contactId} was not updated - may already be opened, not found, or email not sent`);
        }
        
      } catch (updateError) {
        console.error(`❌ CRITICAL ERROR: Failed to update contact ${contactId} status:`, updateError);
        console.error(`❌ Error details:`, {
          message: updateError.message,
          stack: updateError.stack,
          contactId,
          timestamp: exactBrowserTimestamp
        });
      }
      
    } else {
      // Log and classify non-real requests
      const requestType = isTestRequest ? 'TEST REQUEST' : 
                          isValidationRequest ? 'VALIDATION REQUEST' : 
                          isEndpointTest ? 'ENDPOINT TEST' : 'UNKNOWN';
      
      console.log(`🧪 ${requestType}: Not updating real email status for contact ${contactId}`);
      console.log(`ℹ️ Request data stored for analysis purposes only`);
    }
    
    // Return tracking pixel with enhanced headers
    const processingTime = Date.now() - requestStartTime;
    console.log(`⚡ Tracking request processed in ${processingTime}ms for contact ${contactId}`);
    
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: getTrackingHeaders(exactBrowserTimestamp, contactId, requestId),
    });
    
  } catch (error) {
    const processingTime = Date.now() - requestStartTime;
    console.error(`❌ TRACKING ERROR (${processingTime}ms):`, error);
    console.error(`❌ Error context:`, {
      contactId: params.contactId,
      timestamp: exactBrowserTimestamp,
      requestId,
      stack: error.stack
    });
    
    // Always return tracking pixel even on error to avoid breaking email display
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: getTrackingHeaders(exactBrowserTimestamp, 'error', requestId),
    });
  }
}

// Enhanced headers for maximum compatibility and accurate tracking
function getTrackingHeaders(timestamp: string, contactId?: string, requestId?: string) {
  const now = new Date().toUTCString();
  
  return {
    'Content-Type': 'image/png',
    'Content-Length': TRACKING_PIXEL.length.toString(),
    
    // Aggressive cache prevention for accurate tracking
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, private, no-transform',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': now,
    'ETag': `"tracking-${timestamp}-${Date.now()}"`,
    
    // Enhanced CORS headers for email client compatibility
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, User-Agent, Referer, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    
    // Security and privacy headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, notranslate',
    
    // Custom tracking headers for debugging and analytics
    'X-Tracking-Timestamp': timestamp,
    'X-Tracking-Contact-ID': contactId || 'unknown',
    'X-Tracking-Request-ID': requestId || 'unknown',
    'X-Tracking-Status': 'processed',
    'X-Tracking-Version': '2.0-exact-timing',
    
    // Additional email client compatibility
    'Accept-Ranges': 'bytes',
    'Vary': 'User-Agent, Accept-Encoding',
    
    // Prevent transformation by proxies
    'Cache-Control': 'no-transform',
    'X-Content-Duration': '0'
  };
}

// Enhanced OPTIONS handler for CORS preflight
export async function OPTIONS() {
  console.log('🔧 CORS preflight request received for tracking endpoint');
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, User-Agent, Referer, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Enhanced POST endpoint for tracking status validation and analytics
export async function POST(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const contactId = params.contactId;
    const body = await request.json().catch(() => ({}));
    
    console.log(`🔍 Tracking status check requested for contact: ${contactId}`);
    
    // Get tracking data from memory for this contact
    const contactTrackingAttempts = Array.from(trackingAttempts.entries())
      .filter(([key, data]) => data.contactId === contactId)
      .map(([key, data]) => ({ key, ...data }));
    
    // Get all recent tracking attempts (last 24 hours)
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentAttempts = Array.from(trackingAttempts.entries())
      .filter(([key, data]) => new Date(data.timestamp).getTime() > twentyFourHoursAgo)
      .map(([key, data]) => ({ key, ...data }));
    
    const response = {
      contactId,
      trackingAttempts: contactTrackingAttempts,
      recentActivity: recentAttempts.slice(0, 10), // Latest 10 attempts
      timestamp: new Date().toISOString(),
      summary: {
        totalAttemptsForContact: contactTrackingAttempts.length,
        realEmailOpens: contactTrackingAttempts.filter(a => a.realEmailOpen && a.processed).length,
        testRequests: contactTrackingAttempts.filter(a => a.isTestRequest).length,
        validationRequests: contactTrackingAttempts.filter(a => a.isValidationRequest).length,
        processedOpens: contactTrackingAttempts.filter(a => a.processed).length,
        recentActivity: recentAttempts.length
      },
      analytics: {
        lastRealOpen: contactTrackingAttempts
          .filter(a => a.realEmailOpen && a.processed)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] || null,
        uniqueIPs: [...new Set(contactTrackingAttempts.map(a => a.ip))].length,
        uniqueUserAgents: [...new Set(contactTrackingAttempts.map(a => a.userAgent))].length
      }
    };
    
    console.log(`📊 Tracking analysis for ${contactId}:`, response.summary);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error checking tracking status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check tracking status',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Cleanup function to prevent memory leaks
function cleanupOldTrackingAttempts() {
  const fortyEightHoursAgo = Date.now() - (48 * 60 * 60 * 1000);
  let cleaned = 0;
  
  for (const [key, data] of trackingAttempts.entries()) {
    const dataTime = new Date(data.timestamp).getTime();
    if (dataTime < fortyEightHoursAgo) {
      trackingAttempts.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} old tracking attempts (older than 48 hours)`);
  }
}

// Run cleanup every 2 hours
setInterval(cleanupOldTrackingAttempts, 2 * 60 * 60 * 1000);