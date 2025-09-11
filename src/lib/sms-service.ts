// SMS Service Integration with Twilio and Mock for Development

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Mock SMS service for development
export async function sendSMSMock(phone: string, message: string): Promise<SMSResult> {
  console.log('\n📱 MOCK SMS SERVICE (No Twilio configured)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📲 SMS WOULD BE SENT:');
  console.log(`   TO: ${phone}`);
  console.log(`   MESSAGE: ${message}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return {
    success: true,
    messageId: `mock-sms-${Date.now()}`
  };
}

// Real Twilio SMS service
export async function sendSMSTwilio(phone: string, message: string): Promise<SMSResult> {
  try {
    // Dynamic import to avoid loading Twilio unless needed
    const twilio = await import('twilio');
    
    const client = twilio.default(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    
    return {
      success: true,
      messageId: result.sid
    };
  } catch (error) {
    console.error('Twilio SMS error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS'
    };
  }
}

// Main SMS sending function with fallback
export async function sendSMS(phone: string, message: string): Promise<SMSResult> {
  // Check if Twilio is configured
  const twilioConfigured = !!(
    process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_PHONE_NUMBER
  );
  
  if (twilioConfigured) {
    console.log(`📱 Sending SMS via Twilio to ${phone}`);
    return await sendSMSTwilio(phone, message);
  } else {
    console.log(`📱 Using mock SMS service for ${phone}`);
    return await sendSMSMock(phone, message);
  }
}

// Send verification code SMS
export async function sendVerificationSMS(phone: string, code: string): Promise<SMSResult> {
  const message = `Your Fisher Backflows verification code is: ${code}. This code expires in 10 minutes.`;
  return await sendSMS(phone, message);
}

// Send 2FA login code SMS
export async function send2FASMS(phone: string, code: string): Promise<SMSResult> {
  const message = `Your Fisher Backflows login code is: ${code}. If you didn't request this, please ignore.`;
  return await sendSMS(phone, message);
}

// Send appointment reminder SMS
export async function sendAppointmentReminderSMS(
  phone: string, 
  appointmentDate: string,
  appointmentTime: string
): Promise<SMSResult> {
  const message = `Reminder: Your Fisher Backflows appointment is scheduled for ${appointmentDate} at ${appointmentTime}. Reply STOP to unsubscribe.`;
  return await sendSMS(phone, message);
}

// Format phone number for SMS (ensure E.164 format)
export function formatPhoneForSMS(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // If it's 10 digits, assume US number and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it's 11 digits starting with 1, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If it already starts with +, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Default: add + and hope for the best
  return `+${digits}`;
}

// Validate phone number format
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneForSMS(phone);
  // E.164 format: + followed by up to 15 digits
  return /^\+[1-9]\d{1,14}$/.test(formatted);
}