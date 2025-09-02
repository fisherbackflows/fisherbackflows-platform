import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail, emailTemplates } from '@/lib/email';
import { logger } from '@/lib/logger';
import StripeService, { StripeWebhookHandler } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  // Check if Stripe is properly configured
  if (!StripeService.isInitialized()) {
    logger.error('Stripe service not properly initialized');
    return NextResponse.json({ error: 'Payment service not available' }, { status: 503 });
  }

  logger.info('Webhook endpoint hit - Stripe initialized successfully');

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  let event;

  // Handle signature verification using the centralized webhook handler
  if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
    event = StripeWebhookHandler.verifySignature(body, signature);
    if (!event) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  } else if (process.env.NODE_ENV === 'development') {
    // In development without webhook secret, parse body directly
    try {
      event = JSON.parse(body);
      logger.info('Development mode: parsing webhook without signature verification');
    } catch (err) {
      logger.error('Failed to parse webhook body', err);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  } else {
    logger.error('Missing Stripe signature or webhook secret');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  logger.info('Stripe webhook received', { type: event.type });

  try {
    // Use the centralized webhook handler
    await StripeWebhookHandler.handleEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing failed', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}