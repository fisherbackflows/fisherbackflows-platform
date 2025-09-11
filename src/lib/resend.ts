import { Resend } from 'resend';

// Initialize Resend client (will be null if no API key)
const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Email sending function with fallback to Supabase
export async function sendEmail({
  to,
  subject,
  html,
  from = 'Fisher Backflows <noreply@mail.fisherbackflows.com>',
  replyTo = 'fisherbackflows@gmail.com'
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}) {
  if (!resend) {
    // MOCK EMAIL SERVICE FOR DEVELOPMENT
    console.log('\n🔧 MOCK EMAIL SERVICE (No RESEND_API_KEY configured)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 EMAIL WOULD BE SENT:');
    console.log(`   FROM: ${from}`);
    console.log(`   TO: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`   SUBJECT: ${subject}`);
    console.log(`   REPLY-TO: ${replyTo}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Extract verification URL from HTML if present
    const verificationUrlMatch = html.match(/href="([^"]*verify[^"]*)"/);
    if (verificationUrlMatch) {
      console.log('🔗 VERIFICATION LINK:');
      console.log(`   ${verificationUrlMatch[1]}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    
    // Return success for development/testing
    return {
      success: true,
      data: {
        id: `mock-email-${Date.now()}`,
        from,
        to: Array.isArray(to) ? to : [to],
        subject
      }
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      reply_to: replyTo
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}

// Simple verification email template that works with email parameter
export function getSimpleVerificationEmailHtml(email: string, customerName: string = 'Valued Customer') {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-simple?email=${encodeURIComponent(email)}`;
  return getVerificationEmailHtml(verificationUrl, customerName);
}

// Verification email template
export function getVerificationEmailHtml(verificationUrl: string, customerName: string = 'Valued Customer') {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Fisher Backflows</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #2c3e50;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .content p {
            margin-bottom: 20px;
            color: #555;
        }
        .button-container {
            text-align: center;
            margin: 40px 0;
        }
        .verify-button {
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: transform 0.3s ease;
        }
        .verify-button:hover {
            transform: translateY(-2px);
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        .divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 30px 0;
        }
        .info-box {
            background-color: #f0f7ff;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 Fisher Backflows</h1>
            <p style="margin-top: 10px; opacity: 0.9;">Professional Backflow Testing & Compliance</p>
        </div>
        
        <div class="content">
            <h2>Welcome, ${customerName}!</h2>
            
            <p>Thank you for choosing Fisher Backflows for your backflow testing and compliance needs. We're excited to have you join our community of satisfied customers in the Tacoma area.</p>
            
            <p>To get started and access your customer portal, please verify your email address by clicking the button below:</p>
            
            <div class="button-container">
                <a href="${verificationUrl}" class="verify-button">Verify Email Address</a>
            </div>
            
            <div class="info-box">
                <strong>What happens next?</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Access your personalized customer portal</li>
                    <li>Schedule backflow testing appointments</li>
                    <li>View test reports and compliance status</li>
                    <li>Manage your devices and properties</li>
                    <li>Receive automated reminders for testing due dates</li>
                </ul>
            </div>
            
            <div class="divider"></div>
            
            <p><strong>Having trouble with the button?</strong></p>
            <p>Copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea; font-size: 14px;">${verificationUrl}</p>
            
            <div class="divider"></div>
            
            <p><strong>Why verification is important:</strong></p>
            <p>Email verification helps us ensure that your test reports and important compliance notifications reach you securely. It also protects your account from unauthorized access.</p>
        </div>
        
        <div class="footer">
            <p><strong>Fisher Backflows</strong></p>
            <p>Professional Backflow Testing Services<br>
            Tacoma, WA | (253) 555-0123</p>
            <p style="margin-top: 20px;">
                <a href="https://www.fisherbackflows.com">Visit our website</a> | 
                <a href="mailto:fisherbackflows@gmail.com">Contact Support</a>
            </p>
            <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">
                If you didn't create an account with Fisher Backflows, please ignore this email.
            </p>
        </div>
    </div>
</body>
</html>
  `;
}

// Test email sending (for debugging)
export async function testResendConnection() {
  if (!resend) {
    return {
      success: false,
      error: 'Resend API key not configured'
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Fisher Backflows <noreply@mail.fisherbackflows.com>',
      to: 'fisherbackflows@gmail.com',
      subject: 'Test Email from Fisher Backflows Platform',
      html: `
        <h2>Test Email Successful!</h2>
        <p>This is a test email from your Fisher Backflows platform.</p>
        <p>If you're seeing this, your Resend integration is working correctly.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send test email' 
    };
  }
}