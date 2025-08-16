// app/api/track/[contactId]/route.ts - IMPROVED EMAIL TRACKING
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
    
    // Get user agent and IP for logging
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'Unknown';
    
    // Log the tracking event with details
    console.log(`📧 EMAIL OPENED - Contact ID: ${contactId}`);
    console.log(`   └─ IP: ${ip}`);
    console.log(`   └─ User Agent: ${userAgent}`);
    console.log(`   └─ Timestamp: ${new Date().toISOString()}`);
    
    // Validate contact ID
    if (!contactId || contactId === 'undefined' || contactId === 'null') {
      console.log(`⚠️ Invalid contact ID: ${contactId}`);
      return new NextResponse(TRACKING_PIXEL, {
        status: 200,
        headers: getTrackingHeaders(),
      });
    }
    
    // Update the contact status to 'Opened' (async, don't wait)
    updateContactOpenStatus(contactId)
      .then((updated) => {
        if (updated) {
          console.log(`✅ Contact ${contactId} successfully marked as opened`);
        } else {
          console.log(`⚠️ Contact ${contactId} was not updated (already opened or not found)`);
        }
      })
      .catch((error) => {
        console.error(`❌ Failed to update contact ${contactId}:`, error.message);
      });
    
    const processingTime = Date.now() - startTime;
    console.log(`⚡ Tracking processed in ${processingTime}ms`);
    
    // Always return the tracking pixel immediately
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: getTrackingHeaders(),
    });
    
  } catch (error) {
    console.error('❌ Error in email tracking route:', error);
    
    // Always return the tracking pixel even if there's an error
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: getTrackingHeaders(),
    });
  }
}

// Function to get consistent tracking headers
function getTrackingHeaders() {
  return {
    'Content-Type': 'image/png',
    'Content-Length': TRACKING_PIXEL.length.toString(),
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toUTCString(),
    'ETag': `"${Date.now()}"`,
    // CORS headers for cross-origin requests
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// Also handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}