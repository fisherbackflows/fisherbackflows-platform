import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const isPrivateMode = process.env.PRIVATE_MODE === 'true';
    
    return NextResponse.json({
      privateMode: isPrivateMode,
      status: isPrivateMode ? 'private' : 'public'
    });
  } catch (error) {
    console.error('Private mode check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user has admin access
    const teamSession = request.cookies.get('team_session')?.value;
    const adminBypass = request.cookies.get('admin-bypass')?.value;
    
    if (!teamSession && !adminBypass) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    const { enable } = await request.json();
    
    // In a real deployment, you would update environment variables
    // or use a database to store this setting
    // For now, we'll return instructions for manual setup
    
    return NextResponse.json({
      success: true,
      message: enable 
        ? 'To enable private mode, set PRIVATE_MODE=true in your environment variables and redeploy'
        : 'To disable private mode, set PRIVATE_MODE=false in your environment variables and redeploy',
      currentStatus: process.env.PRIVATE_MODE === 'true' ? 'private' : 'public',
      requestedStatus: enable ? 'private' : 'public'
    });

  } catch (error) {
    console.error('Private mode toggle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}