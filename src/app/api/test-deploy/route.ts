import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'NEW DEPLOYMENT WORKING - v2.0.0',
    timestamp: new Date().toISOString(),
    test: 'Vercel deployment test'
  });
}