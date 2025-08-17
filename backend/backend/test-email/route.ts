// src/app/api/test-email/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return a simple response to verify the API is working
    return NextResponse.json({
      success: true,
      message: "Test email API route is working!",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Handle any errors
    return NextResponse.json(
      { error: 'Failed to process the test email request' },
      { status: 500 }
    );
  }
}
