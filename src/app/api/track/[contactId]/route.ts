// app/api/track/[contactId]/route.ts - OPTIMIZED EMAIL TRACKING
import { updateContactOpenStatus } from '@/app/actions';
import { NextRequest, NextResponse } from 'next/server';

// 1x1 transparent pixel image data (PNG format)
const TRACKING_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

export async function GET(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  const startTime = Date.now();
  
  try {
    const contactId = params.contactId;
    
    // Get request details for enhanced logging
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'Unknown';
    const referer = request.headers.get('referer') || 'Unknown';
    
    // Enhanced logging with timestamp
    const timestamp = new Date().toISOString();
    console.log(`\n📧 ===== EMAIL OPENED =====`);
    console.log(`🕐 Time: ${timestamp}`);
    console.log(`👤 Contact ID: ${contactId}`);
    console.log(`🌐 IP: ${ip}`);
    console.log(`🔍 User Agent: ${userAgent.substring(0, 100)}...`);
    console.log(`📄 Referer: ${referer}`);
    console.log(`============================\n`);
    
    // Validate contact ID
    if (!contactId || contactId === 'undefined' || contactId === 'null' || contactId.length === 0) {
      console.log(`⚠️ Invalid contact ID received: "${contactId}"`);
      return new NextResponse(TRACKING_PIXEL, {
        status: 200,
        headers: getTrackingHeaders(),
      });
    }
    
    // Update contact status asynchronously for better performance
    updateContactOpenStatus(contactId)
      .then((updated) => {
        const processingTime = Date.now() - startTime;
        if (updated) {
          console.log(`✅ SUCCESS: Contact ${contactId} marked as opened (${processingTime}ms)`);
        } else {
          console.log(`ℹ️ INFO: Contact ${contactId} was not updated - already opened or not found (${processingTime}ms)`);
        }
      })
      .catch((error) => {
        const processingTime = Date.now() - startTime;
        console.error(`❌ ERROR: Failed to update contact ${contactId} (${processingTime}ms):`, error.message);
      });
    
    // Return tracking pixel immediately for best email client compatibility
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: getTrackingHeaders(),
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ TRACKING ERROR (${processingTime}ms):`, error);
    
    // Always return tracking pixel even on error
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: getTrackingHeaders(),
    });
  }
}

// Optimized headers for maximum email client compatibility
function getTrackingHeaders() {
  return {
    'Content-Type': 'image/png',
    'Content-Length': TRACKING_PIXEL.length.toString(),
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, private',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toUTCString(),
    'ETag': `"tracking-${Date.now()}"`,
    // Enhanced CORS headers
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, User-Agent, Referer',
    'Access-Control-Max-Age': '86400',
    // Additional headers for email client compatibility
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
  };
}

// Enhanced OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, User-Agent, Referer',
      'Access-Control-Max-Age': '86400',
    },
  });
}