import { updateContactOpenStatus } from '@/app/actions';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const contactId = params.id;

  if (contactId) {
    try {
      const updated = await updateContactOpenStatus(contactId);
      if (updated) {
        console.log(`📧 Email opened by contact ${contactId} at ${new Date().toISOString()}`);
      }
    } catch (error) {
      console.error('Error updating open status:', error);
    }
  }

  // Return a 1x1 transparent pixel
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  return new NextResponse(pixel, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}