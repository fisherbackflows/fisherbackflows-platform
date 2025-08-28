import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    
    // Log the error
    logger.error('Client error reported', {
      ...errorData,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      url: request.headers.get('referer')
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error reporting failed', error);
    return NextResponse.json({ error: 'Failed to report error' }, { status: 500 });
  }
}