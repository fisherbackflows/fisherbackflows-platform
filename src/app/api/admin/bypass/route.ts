import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Admin bypass code - in production, use a strong, unique code
const ADMIN_BYPASS_CODE = process.env.ADMIN_BYPASS_CODE || 'fisher-admin-2025';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Access code is required' },
        { status: 400 }
      );
    }

    // Verify the bypass code
    if (code !== ADMIN_BYPASS_CODE) {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 401 }
      );
    }

    // Set admin bypass cookie
    const cookieStore = await cookies();
    cookieStore.set('admin-bypass', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: 'Admin access granted'
    });

  } catch (error) {
    console.error('Admin bypass error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}