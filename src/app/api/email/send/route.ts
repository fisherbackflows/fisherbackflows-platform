import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getVerificationEmailHtml } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, type, verificationUrl, customerName } = body;

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    // Handle verification emails
    if (type === 'verification' && verificationUrl) {
      const verificationHtml = getVerificationEmailHtml(verificationUrl, customerName);
      const result = await sendEmail({
        to,
        subject: 'Verify Your Email - Fisher Backflows',
        html: verificationHtml
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Verification email sent successfully',
        data: result.data
      });
    }

    // Handle custom emails
    if (subject && html) {
      const result = await sendEmail({
        to,
        subject,
        html
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        data: result.data
      });
    }

    return NextResponse.json(
      { error: 'Invalid email request. Must provide either verification details or subject/html.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}