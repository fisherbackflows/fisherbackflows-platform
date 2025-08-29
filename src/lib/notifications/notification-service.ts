export interface NotificationConfig {
  type: 'email' | 'sms' | 'push' | 'webhook';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  template?: string;
  delay?: number; // milliseconds
  retryAttempts?: number;
}

export interface EmailNotification {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  template: string;
  data: Record<string, any>;
  attachments?: {
    filename: string;
    content: string | Buffer;
    contentType: string;
  }[];
}

export interface SMSNotification {
  to: string | string[];
  message: string;
  template?: string;
  data?: Record<string, any>;
}

export interface PushNotification {
  userId: string | string[];
  title: string;
  message: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

export interface WebhookNotification {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  payload: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
  retries: number;
}

export interface NotificationQueue {
  id: string;
  type: NotificationConfig['type'];
  config: NotificationConfig;
  payload: EmailNotification | SMSNotification | PushNotification | WebhookNotification;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'retrying';
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date;
  processedAt?: Date;
  result?: NotificationResult;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationService {
  private static instance: NotificationService;
  private queue: Map<string, NotificationQueue> = new Map();
  private processing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Start processing queue every 30 seconds
    this.startProcessing();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private startProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 30000); // Process every 30 seconds
  }

  public async sendEmail(notification: EmailNotification, config: NotificationConfig = { type: 'email', priority: 'medium' }): Promise<NotificationResult> {
    try {
      // In production, this would integrate with SendGrid, AWS SES, etc.
      console.log('Sending email notification:', {
        to: notification.to,
        subject: notification.subject,
        template: notification.template
      });

      // Simulate email sending
      await this.delay(100);

      const result: NotificationResult = {
        success: true,
        messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        retries: 0
      };

      // Log to audit system if available
      this.logNotification('email', notification, result);

      return result;
    } catch (error) {
      const result: NotificationResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        retries: 0
      };

      console.error('Failed to send email:', error);
      return result;
    }
  }

  public async sendSMS(notification: SMSNotification, config: NotificationConfig = { type: 'sms', priority: 'medium' }): Promise<NotificationResult> {
    try {
      // In production, this would integrate with Twilio, AWS SNS, etc.
      console.log('Sending SMS notification:', {
        to: notification.to,
        message: notification.message.substring(0, 50) + '...'
      });

      // Simulate SMS sending
      await this.delay(200);

      const result: NotificationResult = {
        success: true,
        messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        retries: 0
      };

      this.logNotification('sms', notification, result);
      return result;
    } catch (error) {
      const result: NotificationResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        retries: 0
      };

      console.error('Failed to send SMS:', error);
      return result;
    }
  }

  public async sendPushNotification(notification: PushNotification, config: NotificationConfig = { type: 'push', priority: 'medium' }): Promise<NotificationResult> {
    try {
      // In production, this would integrate with FCM, APNs, etc.
      console.log('Sending push notification:', {
        userId: notification.userId,
        title: notification.title,
        message: notification.message
      });

      // Simulate push notification sending
      await this.delay(150);

      const result: NotificationResult = {
        success: true,
        messageId: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        retries: 0
      };

      this.logNotification('push', notification, result);
      return result;
    } catch (error) {
      const result: NotificationResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        retries: 0
      };

      console.error('Failed to send push notification:', error);
      return result;
    }
  }

  public async sendWebhook(notification: WebhookNotification, config: NotificationConfig = { type: 'webhook', priority: 'medium' }): Promise<NotificationResult> {
    try {
      // In production, this would make actual HTTP requests
      console.log('Sending webhook notification:', {
        url: notification.url,
        method: notification.method,
        payload: notification.payload
      });

      // Simulate webhook call
      await this.delay(300);

      const result: NotificationResult = {
        success: true,
        messageId: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        retries: 0
      };

      this.logNotification('webhook', notification, result);
      return result;
    } catch (error) {
      const result: NotificationResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        retries: 0
      };

      console.error('Failed to send webhook:', error);
      return result;
    }
  }

  public queueNotification(
    type: NotificationConfig['type'],
    payload: EmailNotification | SMSNotification | PushNotification | WebhookNotification,
    config: NotificationConfig = { type, priority: 'medium' }
  ): string {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const scheduledAt = config.delay ? new Date(Date.now() + config.delay) : new Date();

    const queueItem: NotificationQueue = {
      id,
      type,
      config,
      payload,
      status: 'pending',
      attempts: 0,
      maxAttempts: config.retryAttempts || 3,
      scheduledAt,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.queue.set(id, queueItem);
    console.log(`Queued ${type} notification with ID: ${id}`);

    return id;
  }

  private async processQueue() {
    if (this.processing) return;

    this.processing = true;
    const now = new Date();

    try {
      for (const [id, item] of this.queue.entries()) {
        if (item.status === 'pending' && item.scheduledAt <= now) {
          await this.processQueueItem(item);
        } else if (item.status === 'failed' && item.attempts < item.maxAttempts) {
          // Retry failed items after exponential backoff
          const backoffTime = Math.pow(2, item.attempts) * 60000; // 1min, 2min, 4min...
          if (item.processedAt && (now.getTime() - item.processedAt.getTime()) > backoffTime) {
            await this.processQueueItem(item);
          }
        }
      }

      // Clean up completed items older than 1 hour
      for (const [id, item] of this.queue.entries()) {
        if ((item.status === 'sent' || (item.status === 'failed' && item.attempts >= item.maxAttempts)) &&
            item.processedAt && (now.getTime() - item.processedAt.getTime()) > 3600000) {
          this.queue.delete(id);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  private async processQueueItem(item: NotificationQueue) {
    item.status = 'processing';
    item.attempts++;
    item.updatedAt = new Date();

    let result: NotificationResult;

    try {
      switch (item.type) {
        case 'email':
          result = await this.sendEmail(item.payload as EmailNotification, item.config);
          break;
        case 'sms':
          result = await this.sendSMS(item.payload as SMSNotification, item.config);
          break;
        case 'push':
          result = await this.sendPushNotification(item.payload as PushNotification, item.config);
          break;
        case 'webhook':
          result = await this.sendWebhook(item.payload as WebhookNotification, item.config);
          break;
        default:
          throw new Error(`Unsupported notification type: ${item.type}`);
      }

      item.result = result;
      item.status = result.success ? 'sent' : 'failed';
      item.processedAt = new Date();
    } catch (error) {
      item.result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        retries: item.attempts
      };
      item.status = 'failed';
      item.processedAt = new Date();
    }

    this.queue.set(item.id, item);
  }

  public getQueueStatus(): { pending: number; processing: number; sent: number; failed: number; total: number } {
    const counts = { pending: 0, processing: 0, sent: 0, failed: 0, total: this.queue.size };

    for (const item of this.queue.values()) {
      counts[item.status]++;
    }

    return counts;
  }

  public getQueueItem(id: string): NotificationQueue | undefined {
    return this.queue.get(id);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private logNotification(type: string, payload: any, result: NotificationResult) {
    // In production, this would integrate with the audit logging system
    console.log(`Notification ${type} result:`, {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      timestamp: result.timestamp
    });
  }

  // Payment-related notification methods
  public async sendPaymentConfirmation(paymentData: any): Promise<NotificationResult> {
    return this.sendEmail({
      to: paymentData.customer_email || '',
      subject: 'Payment Confirmation',
      template: 'payment_confirmation',
      data: paymentData
    });
  }

  public async sendPaymentFailureNotification(paymentData: any): Promise<NotificationResult> {
    return this.sendEmail({
      to: paymentData.customer_email || '',
      subject: 'Payment Failed',
      template: 'payment_failure',
      data: paymentData
    });
  }

  public async sendRefundConfirmation(refundData: any): Promise<NotificationResult> {
    return this.sendEmail({
      to: refundData.customer_email || '',
      subject: 'Refund Confirmation',
      template: 'refund_confirmation',
      data: refundData
    });
  }

  public async sendSubscriptionStatusUpdate(subscriptionData: any): Promise<NotificationResult> {
    return this.sendEmail({
      to: subscriptionData.customer_email || '',
      subject: 'Subscription Status Update',
      template: 'subscription_update',
      data: subscriptionData
    });
  }

  public async sendInvoicePaymentConfirmation(invoiceData: any): Promise<NotificationResult> {
    return this.sendEmail({
      to: invoiceData.customer_email || '',
      subject: 'Invoice Payment Confirmation',
      template: 'invoice_payment_confirmation',
      data: invoiceData
    });
  }

  public async sendCheckoutConfirmation(checkoutData: any): Promise<NotificationResult> {
    return this.sendEmail({
      to: checkoutData.customer_email || '',
      subject: 'Checkout Confirmation',
      template: 'checkout_confirmation',  
      data: checkoutData
    });
  }

  public destroy() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.queue.clear();
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Convenience functions for common use cases
export async function sendEmail(notification: EmailNotification, config?: NotificationConfig): Promise<NotificationResult> {
  return notificationService.sendEmail(notification, config);
}

export async function sendSMS(notification: SMSNotification, config?: NotificationConfig): Promise<NotificationResult> {
  return notificationService.sendSMS(notification, config);
}

export async function sendPushNotification(notification: PushNotification, config?: NotificationConfig): Promise<NotificationResult> {
  return notificationService.sendPushNotification(notification, config);
}

export function queueEmail(notification: EmailNotification, config?: NotificationConfig): string {
  return notificationService.queueNotification('email', notification, { type: 'email', priority: 'medium', ...config });
}

export function queueSMS(notification: SMSNotification, config?: NotificationConfig): string {
  return notificationService.queueNotification('sms', notification, { type: 'sms', priority: 'medium', ...config });
}