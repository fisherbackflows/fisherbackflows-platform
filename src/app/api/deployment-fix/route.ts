import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'VERCEL DEPLOYMENT FIXED - v3.0.0',
    timestamp: new Date().toISOString(),
    deploymentTest: true,
    routes: {
      appointments: 'SUCCESS STATUS FIXED',
      invoices: 'SUCCESS STATUS FIXED', 
      health: 'DATABASE STATUS FIXED'
    }
  });
}