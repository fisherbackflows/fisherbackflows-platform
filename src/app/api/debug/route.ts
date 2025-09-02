import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    url: request.url,
    pathname: new URL(request.url).pathname,
    nodeEnv: process.env.NODE_ENV,
    privateMode: process.env.PRIVATE_MODE_ENABLED,
    cookies: {
      privateMode: request.cookies.get('site-private-mode')?.value,
      adminBypass: request.cookies.get('admin-bypass')?.value,
      teamSession: !!request.cookies.get('team_session')?.value
    },
    headers: {
      userAgent: request.headers.get('user-agent'),
      host: request.headers.get('host')
    }
  });
}