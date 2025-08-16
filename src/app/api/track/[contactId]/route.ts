// app/api/track/[contactId]/route.ts
import { updateContactOpenStatus } from '@/app/actions';
import { NextRequest, NextResponse } from 'next/server';

// 1x1 transparent pixel image data
const TRACKING_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

export async function GET(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const contactId = params.contactId;
    
    // Log the tracking event
    console.log(`📧 Email opened by contact ID: ${contactId}`);
    
    // Update the contact status to 'Opened'
    const updated = await updateContactOpenStatus(contactId);
    
    if (updated) {
      console.log(`✅ Contact ${contactId} marked as opened`);
    } else {
      console.log(`⚠️ Contact ${contactId} not found or already opened`);
    }
    
    // Return a 1x1 transparent PNG image
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Length': TRACKING_PIXEL.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('❌ Error in email tracking:', error);
    
    // Still return the tracking pixel even if there's an error
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}