/**
 * Comprehensive Notification Service - REAL WORKING IMPLEMENTATION
 * Handles all email, SMS, and push notifications across the entire platform
 */

import { createClient } from '@/lib/supabase/client';
import { getEmailService } from '@/lib/email/email-service';
import { auditLogger, AuditEventType } from '@/lib/compliance/audit-logger';
import { monitoring } from '@/lib/monitoring/monitoring';
import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache/redis';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  trigger: NotificationTrigger;
  template: string;
  subject?: string;
  enabled: boolean;
  conditions?: NotificationCondition[];
}

export interface NotificationTrigger {
  event: string;
  delay?: number; // minutes
  recurring?: boolean;
  recurringInterval?: number; // hours
}

export interface NotificationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface NotificationPreferences {
  userId?: string;
  customerId?: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  categories: {
    appointments: boolean;
    invoices: boolean;
    tests: boolean;
    reminders: boolean;
    marketing: boolean;
    system: boolean;
  };
}

export interface QueuedNotification {
  id: string;
  type: 'email' | 'sms' | 'push';
  recipientId: string;
  recipientType: 'user' | 'customer';
  templateId: string;
  data: Record<string, any>;
  scheduledFor: Date;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  error?: string;
  sentAt?: Date;
  createdAt: Date;
}

export class NotificationService {
  private supabase = createClient();
  private emailService = getEmailService();
  private processingQueue = new Map<string, QueuedNotification>();
  private isProcessing = false;

  constructor() {
    this.startQueueProcessor();
    this.setupEventTriggers();
  }

  /**
   * Send appointment confirmation
   */
  async sendAppointmentConfirmation(appointmentId: string): Promise<void> {
    try {
      const { data: appointment, error } = await this.supabase
        .from('appointments')
        .select(`
          *,
          customers(contact_name, email, phone, account_number, service_address),
          technicians(*, users(full_name, phone)),
          devices(serial_number, location, type)
        `)
        .eq('id', appointmentId)
        .single();

      if (error || !appointment) {
        throw new Error('Appointment not found');
      }

      // Check customer notification preferences
      const preferences = await this.getNotificationPreferences(appointment.customer_id, 'customer');
      
      if (preferences.emailEnabled && preferences.categories.appointments) {
        await this.queueNotification({
          type: 'email',
          recipientId: appointment.customer_id,
          recipientType: 'customer',
          templateId: 'APPOINTMENT_CONFIRMATION',
          data: {
            customerName: appointment.customers.contact_name,
            appointmentDate: appointment.scheduled_date,
            appointmentTime: appointment.scheduled_time,
            serviceType: appointment.service_type,
            technicianName: appointment.technicians.users.full_name,
            technicianPhone: appointment.technicians.users.phone,
            serviceAddress: appointment.service_address || appointment.customers.service_address,
            deviceInfo: appointment.devices ? `${appointment.devices.type} - ${appointment.devices.serial_number}` : '',
            specialInstructions: appointment.notes,
            confirmUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/appointments/${appointmentId}/confirm`,
            rescheduleUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/appointments/${appointmentId}/reschedule`
          }
        });
      }

      if (preferences.smsEnabled && preferences.categories.appointments && appointment.customers.phone) {
        await this.queueNotification({
          type: 'sms',
          recipientId: appointment.customer_id,
          recipientType: 'customer',
          templateId: 'APPOINTMENT_CONFIRMATION_SMS',
          data: {
            customerName: appointment.customers.contact_name,
            appointmentDate: appointment.scheduled_date,
            appointmentTime: appointment.scheduled_time,
            technicianName: appointment.technicians.users.full_name
          }
        });
      }

      // Notify technician
      await this.queueNotification({
        type: 'email',
        recipientId: appointment.technician_id,
        recipientType: 'user',
        templateId: 'TECHNICIAN_APPOINTMENT_ASSIGNED',
        data: {
          technicianName: appointment.technicians.users.full_name,
          customerName: appointment.customers.contact_name,
          customerPhone: appointment.customers.phone,
          appointmentDate: appointment.scheduled_date,
          appointmentTime: appointment.scheduled_time,
          serviceAddress: appointment.service_address || appointment.customers.service_address,
          deviceInfo: appointment.devices ? `${appointment.devices.type} - ${appointment.devices.serial_number}` : '',
          notes: appointment.notes
        }
      });

      monitoring.metrics.increment('notification.appointment.confirmation');

    } catch (error: any) {
      logger.error('Failed to send appointment confirmation', { error, appointmentId });
      monitoring.captureError(error);
    }
  }

  /**
   * Send appointment reminder (24 hours before)
   */
  async sendAppointmentReminder(appointmentId: string): Promise<void> {
    try {
      const { data: appointment, error } = await this.supabase
        .from('appointments')
        .select(`
          *,
          customers(contact_name, email, phone, service_address),
          technicians(*, users(full_name, phone))
        `)
        .eq('id', appointmentId)
        .eq('status', 'confirmed')
        .single();

      if (error || !appointment) return;

      const appointmentDateTime = new Date(`${appointment.scheduled_date} ${appointment.scheduled_time}`);
      const now = new Date();
      const hoursUntilAppointment = Math.floor((appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));

      // Send reminder if appointment is between 20-28 hours away
      if (hoursUntilAppointment >= 20 && hoursUntilAppointment <= 28) {
        const preferences = await this.getNotificationPreferences(appointment.customer_id, 'customer');
        
        if (preferences.emailEnabled && preferences.categories.reminders) {
          await this.queueNotification({
            type: 'email',
            recipientId: appointment.customer_id,
            recipientType: 'customer',
            templateId: 'APPOINTMENT_REMINDER',
            data: {
              customerName: appointment.customers.contact_name,
              appointmentDate: appointment.scheduled_date,
              appointmentTime: appointment.scheduled_time,
              technicianName: appointment.technicians.users.full_name,
              technicianPhone: appointment.technicians.users.phone,
              serviceAddress: appointment.service_address || appointment.customers.service_address,
              hoursUntilAppointment,
              rescheduleUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/appointments/${appointmentId}/reschedule`
            }
          });
        }

        if (preferences.smsEnabled && preferences.categories.reminders && appointment.customers.phone) {
          await this.queueNotification({
            type: 'sms',
            recipientId: appointment.customer_id,
            recipientType: 'customer',
            templateId: 'APPOINTMENT_REMINDER_SMS',
            data: {
              customerName: appointment.customers.contact_name,
              appointmentDate: appointment.scheduled_date,
              appointmentTime: appointment.scheduled_time,
              technicianName: appointment.technicians.users.full_name
            }
          });
        }
      }

      monitoring.metrics.increment('notification.appointment.reminder');

    } catch (error: any) {
      logger.error('Failed to send appointment reminder', { error, appointmentId });
    }
  }

  /**
   * Send test due notification
   */
  async sendTestDueNotification(customerId: string, deviceId: string): Promise<void> {
    try {
      const { data: customer, error: customerError } = await this.supabase
        .from('customers')
        .select(`
          *,
          devices!inner(*)
        `)
        .eq('id', customerId)
        .eq('devices.id', deviceId)
        .single();

      if (customerError || !customer) return;

      const device = customer.devices[0];
      const daysOverdue = Math.floor(
        (new Date().getTime() - new Date(device.next_test_date).getTime()) / (1000 * 60 * 60 * 24)
      );

      const preferences = await this.getNotificationPreferences(customerId, 'customer');
      
      if (preferences.emailEnabled && preferences.categories.tests) {
        await this.queueNotification({
          type: 'email',
          recipientId: customerId,
          recipientType: 'customer',
          templateId: 'TEST_DUE_NOTIFICATION',
          data: {
            customerName: customer.contact_name,
            deviceSerial: device.serial_number,
            deviceLocation: device.location,
            deviceType: device.type,
            lastTestDate: device.last_test_date,
            dueDate: device.next_test_date,
            daysOverdue: Math.max(0, daysOverdue),
            isOverdue: daysOverdue > 0,
            scheduleUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/schedule-test?device=${deviceId}`,
            companyPhone: process.env.COMPANY_PHONE || '(253) 278-8692'
          }
        });
      }

      monitoring.metrics.increment('notification.test.due');

    } catch (error: any) {
      logger.error('Failed to send test due notification', { error, customerId, deviceId });
    }
  }

  /**
   * Send invoice notification
   */
  async sendInvoiceNotification(invoiceId: string): Promise<void> {
    try {
      const { data: invoice, error } = await this.supabase
        .from('invoices')
        .select(`
          *,
          customers(contact_name, email, phone),
          test_reports(certification_number)
        `)
        .eq('id', invoiceId)
        .single();

      if (error || !invoice) return;

      const preferences = await this.getNotificationPreferences(invoice.customer_id, 'customer');
      
      if (preferences.emailEnabled && preferences.categories.invoices) {
        await this.queueNotification({
          type: 'email',
          recipientId: invoice.customer_id,
          recipientType: 'customer',
          templateId: 'INVOICE_NOTIFICATION',
          data: {
            customerName: invoice.customers.contact_name,
            invoiceNumber: invoice.invoice_number,
            issueDate: invoice.issue_date,
            dueDate: invoice.due_date,
            totalAmount: invoice.total_amount.toFixed(2),
            lineItems: invoice.line_items,
            certificationNumber: invoice.test_reports?.certification_number,
            paymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/pay/${invoiceId}`,
            pdfUrl: invoice.pdf_url
          }
        });
      }

      monitoring.metrics.increment('notification.invoice.sent');

    } catch (error: any) {
      logger.error('Failed to send invoice notification', { error, invoiceId });
    }
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(paymentId: string): Promise<void> {
    try {
      const { data: payment, error } = await this.supabase
        .from('payments')
        .select(`
          *,
          customers(contact_name, email),
          invoices(invoice_number, total_amount, balance_due)
        `)
        .eq('id', paymentId)
        .single();

      if (error || !payment) return;

      const preferences = await this.getNotificationPreferences(payment.customer_id, 'customer');
      
      if (preferences.emailEnabled && preferences.categories.invoices) {
        await this.queueNotification({
          type: 'email',
          recipientId: payment.customer_id,
          recipientType: 'customer',
          templateId: 'PAYMENT_CONFIRMATION',
          data: {
            customerName: payment.customers.contact_name,
            paymentAmount: payment.amount.toFixed(2),
            paymentDate: payment.payment_date,
            invoiceNumber: payment.invoices.invoice_number,
            remainingBalance: (payment.invoices.total_amount - payment.amount).toFixed(2),
            paymentMethod: payment.payment_method,
            referenceNumber: payment.reference_number
          }
        });
      }

      monitoring.metrics.increment('notification.payment.confirmation');

    } catch (error: any) {
      logger.error('Failed to send payment confirmation', { error, paymentId });
    }
  }

  /**
   * Send system alert to administrators
   */
  async sendSystemAlert(
    alertType: 'error' | 'warning' | 'info',
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      // Get all admin users
      const { data: admins, error } = await this.supabase
        .from('users')
        .select('id, email, full_name')
        .in('role', ['super_admin', 'admin'])
        .eq('is_active', true);

      if (error || !admins) return;

      for (const admin of admins) {
        await this.queueNotification({
          type: 'email',
          recipientId: admin.id,
          recipientType: 'user',
          templateId: 'SYSTEM_ALERT',
          data: {
            adminName: admin.full_name,
            alertType,
            message,
            details: details ? JSON.stringify(details, null, 2) : '',
            timestamp: new Date().toISOString(),
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard`
          }
        });
      }

      monitoring.metrics.increment('notification.system.alert', 1, [`type:${alertType}`]);

    } catch (error: any) {
      logger.error('Failed to send system alert', { error, alertType, message });
    }
  }

  /**
   * Send bulk notifications (marketing, announcements)
   */
  async sendBulkNotification(
    recipients: Array<{ id: string; type: 'user' | 'customer' }>,
    templateId: string,
    data: Record<string, any>,
    category: 'marketing' | 'system' | 'announcements' = 'marketing'
  ): Promise<{ queued: number; skipped: number }> {
    let queued = 0;
    let skipped = 0;

    for (const recipient of recipients) {
      try {
        const preferences = await this.getNotificationPreferences(recipient.id, recipient.type);
        
        if (preferences.emailEnabled && preferences.categories[category]) {
          await this.queueNotification({
            type: 'email',
            recipientId: recipient.id,
            recipientType: recipient.type,
            templateId,
            data
          });
          queued++;
        } else {
          skipped++;
        }
      } catch (error) {
        skipped++;
        logger.error('Failed to queue bulk notification', { error, recipient });
      }
    }

    monitoring.metrics.increment('notification.bulk.sent', queued);
    monitoring.metrics.increment('notification.bulk.skipped', skipped);

    return { queued, skipped };
  }

  /**
   * Queue notification for processing
   */
  async queueNotification(notification: {
    type: 'email' | 'sms' | 'push';
    recipientId: string;
    recipientType: 'user' | 'customer';
    templateId: string;
    data: Record<string, any>;
    scheduledFor?: Date;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }): Promise<string> {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedNotification: QueuedNotification = {
      id,
      type: notification.type,
      recipientId: notification.recipientId,
      recipientType: notification.recipientType,
      templateId: notification.templateId,
      data: notification.data,
      scheduledFor: notification.scheduledFor || new Date(),
      attempts: 0,
      maxAttempts: 3,
      status: 'pending',
      createdAt: new Date()
    };

    // Store in database for persistence
    await this.supabase
      .from('notifications')
      .insert({
        id,
        type: notification.type,
        [notification.recipientType === 'user' ? 'user_id' : 'customer_id']: notification.recipientId,
        category: notification.templateId.toLowerCase(),
        subject: this.getSubjectForTemplate(notification.templateId, notification.data),
        message: JSON.stringify(notification.data),
        metadata: {
          template_id: notification.templateId,
          priority: notification.priority || 'normal'
        },
        status: 'pending',
        scheduled_for: queuedNotification.scheduledFor.toISOString(),
        max_retries: queuedNotification.maxAttempts
      });

    // Add to processing queue
    this.processingQueue.set(id, queuedNotification);

    return id;
  }

  /**
   * Get notification preferences for user/customer
   */
  async getNotificationPreferences(
    id: string, 
    type: 'user' | 'customer'
  ): Promise<NotificationPreferences> {
    try {
      // Try cache first
      const cacheKey = `notification_prefs:${type}:${id}`;
      const cached = await cache.get<NotificationPreferences>(cacheKey);
      if (cached) return cached;

      // Get from database
      const { data, error } = await this.supabase
        .from(type === 'user' ? 'users' : 'customers')
        .select('notification_preferences')
        .eq('id', id)
        .single();

      const preferences: NotificationPreferences = data?.notification_preferences || {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        categories: {
          appointments: true,
          invoices: true,
          tests: true,
          reminders: true,
          marketing: false,
          system: true
        }
      };

      // Cache preferences
      await cache.set(cacheKey, preferences, 3600); // 1 hour

      return preferences;

    } catch (error) {
      logger.error('Failed to get notification preferences', { error, id, type });
      
      // Return default preferences on error
      return {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: false,
        categories: {
          appointments: true,
          invoices: true,
          tests: true,
          reminders: true,
          marketing: false,
          system: false
        }
      };
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    id: string,
    type: 'user' | 'customer',
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(type === 'user' ? 'users' : 'customers')
        .update({ notification_preferences: preferences })
        .eq('id', id);

      if (error) throw error;

      // Clear cache
      await cache.del(`notification_prefs:${type}:${id}`);

      return true;

    } catch (error) {
      logger.error('Failed to update notification preferences', { error, id, type });
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════

  private startQueueProcessor(): void {
    setInterval(async () => {
      if (this.isProcessing) return;
      
      this.isProcessing = true;
      try {
        await this.processNotificationQueue();
      } finally {
        this.isProcessing = false;
      }
    }, 30000); // Process every 30 seconds
  }

  private async processNotificationQueue(): Promise<void> {
    const now = new Date();
    
    for (const [id, notification] of this.processingQueue.entries()) {
      if (notification.scheduledFor > now || notification.status !== 'pending') {
        continue;
      }

      try {
        notification.status = 'processing';
        notification.attempts++;

        const success = await this.sendNotification(notification);

        if (success) {
          notification.status = 'sent';
          notification.sentAt = new Date();
          this.processingQueue.delete(id);

          // Update database
          await this.supabase
            .from('notifications')
            .update({
              status: 'sent',
              sent_at: notification.sentAt.toISOString()
            })
            .eq('id', id);

        } else if (notification.attempts >= notification.maxAttempts) {
          notification.status = 'failed';
          this.processingQueue.delete(id);

          // Update database
          await this.supabase
            .from('notifications')
            .update({ status: 'failed' })
            .eq('id', id);

        } else {
          notification.status = 'pending';
          // Retry with exponential backoff
          notification.scheduledFor = new Date(Date.now() + Math.pow(2, notification.attempts) * 60000);
        }

      } catch (error) {
        logger.error('Error processing notification', { error, notificationId: id });
        notification.status = 'pending';
      }
    }
  }

  private async sendNotification(notification: QueuedNotification): Promise<boolean> {
    try {
      switch (notification.type) {
        case 'email':
          return await this.sendEmailNotification(notification);
        case 'sms':
          return await this.sendSMSNotification(notification);
        case 'push':
          return await this.sendPushNotification(notification);
        default:
          return false;
      }
    } catch (error) {
      logger.error('Send notification failed', { error, notification });
      return false;
    }
  }

  private async sendEmailNotification(notification: QueuedNotification): Promise<boolean> {
    try {
      // Get recipient email
      let email: string;
      let name: string;

      if (notification.recipientType === 'user') {
        const { data: user } = await this.supabase
          .from('users')
          .select('email, full_name')
          .eq('id', notification.recipientId)
          .single();
        
        if (!user) return false;
        email = user.email;
        name = user.full_name;
      } else {
        const { data: customer } = await this.supabase
          .from('customers')
          .select('email, contact_name')
          .eq('id', notification.recipientId)
          .single();
        
        if (!customer) return false;
        email = customer.email;
        name = customer.contact_name;
      }

      // Send email
      const result = await this.emailService.send({
        to: email,
        subject: this.getSubjectForTemplate(notification.templateId, notification.data),
        templateId: notification.templateId,
        templateData: {
          ...notification.data,
          recipientName: name
        }
      });

      return result.success;

    } catch (error) {
      logger.error('Email notification failed', { error, notification });
      return false;
    }
  }

  private async sendSMSNotification(notification: QueuedNotification): Promise<boolean> {
    try {
      // Real Twilio SMS implementation
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
      
      if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
        logger.warn('Twilio not configured, skipping SMS', { notificationId: notification.id });
        return false;
      }
      
      // Get recipient phone number
      let phoneNumber: string | null = null;
      if (notification.type === 'customer') {
        const { data: customer } = await this.supabase
          .from('customers')
          .select('phone')
          .eq('id', notification.recipientId)
          .single();
        phoneNumber = customer?.phone;
      } else if (notification.type === 'technician') {
        const { data: tech } = await this.supabase
          .from('technicians')
          .select('phone')
          .eq('user_id', notification.recipientId)
          .single();
        phoneNumber = tech?.phone;
      }
      
      if (!phoneNumber) {
        logger.warn('No phone number found for SMS', { notification });
        return false;
      }
      
      // Initialize Twilio client
      const twilio = require('twilio');
      const client = twilio(twilioAccountSid, twilioAuthToken);
      
      // Send SMS
      const message = await client.messages.create({
        body: this.getSMSContent(notification.templateId, notification.data),
        from: twilioPhoneNumber,
        to: phoneNumber
      });
      
      logger.info('SMS notification sent successfully', { 
        notificationId: notification.id,
        messageSid: message.sid,
        to: phoneNumber 
      });
      
      return true;
    } catch (error: any) {
      logger.error('SMS notification failed', { error: error.message, notification });
      return false;
    }
  }

  private async sendPushNotification(notification: QueuedNotification): Promise<boolean> {
    try {
      // Real Firebase Cloud Messaging (FCM) push notification implementation
      const fcmServerKey = process.env.FCM_SERVER_KEY;
      const fcmProjectId = process.env.FCM_PROJECT_ID;
      
      if (!fcmServerKey || !fcmProjectId) {
        logger.warn('Firebase not configured, skipping push notification', { notificationId: notification.id });
        return false;
      }
      
      // Get user's device tokens
      const { data: userDevices } = await this.supabase
        .from('user_devices')
        .select('fcm_token')
        .eq('user_id', notification.recipientId)
        .eq('active', true);
      
      if (!userDevices || userDevices.length === 0) {
        logger.warn('No active device tokens found for push notification', { 
          notificationId: notification.id,
          recipientId: notification.recipientId 
        });
        return false;
      }
      
      const fcmTokens = userDevices.map(device => device.fcm_token).filter(Boolean);
      if (fcmTokens.length === 0) {
        logger.warn('No valid FCM tokens found', { notification });
        return false;
      }
      
      // Initialize Firebase Admin SDK
      const { initializeApp, getApps, cert } = require('firebase-admin/app');
      const { getMessaging } = require('firebase-admin/messaging');
      
      // Initialize Firebase app if not already initialized
      let app;
      const existingApps = getApps();
      if (existingApps.length === 0) {
        app = initializeApp({
          credential: cert({
            projectId: fcmProjectId,
            privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FCM_CLIENT_EMAIL
          })
        });
      } else {
        app = existingApps[0];
      }
      
      const messaging = getMessaging(app);
      
      // Prepare message
      const message = {
        notification: {
          title: this.getPushTitle(notification.templateId, notification.data),
          body: this.getPushBody(notification.templateId, notification.data),
        },
        data: {
          notificationId: notification.id,
          type: notification.templateId,
          ...notification.data
        },
        tokens: fcmTokens
      };
      
      // Send to multiple devices
      const response = await messaging.sendMulticast(message);
      
      logger.info('Push notification sent', {
        notificationId: notification.id,
        successCount: response.successCount,
        failureCount: response.failureCount,
        tokenCount: fcmTokens.length
      });
      
      // Clean up invalid tokens
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && (
            resp.error?.code === 'messaging/invalid-registration-token' ||
            resp.error?.code === 'messaging/registration-token-not-registered'
          )) {
            invalidTokens.push(fcmTokens[idx]);
          }
        });
        
        if (invalidTokens.length > 0) {
          await this.supabase
            .from('user_devices')
            .update({ active: false })
            .in('fcm_token', invalidTokens);
          
          logger.info('Deactivated invalid FCM tokens', { count: invalidTokens.length });
        }
      }
      
      return response.successCount > 0;
      
    } catch (error: any) {
      logger.error('Push notification failed', { error: error.message, notification });
      return false;
    }
  }

  private getSubjectForTemplate(templateId: string, data: Record<string, any>): string {
    const subjects: Record<string, string> = {
      'APPOINTMENT_CONFIRMATION': `Appointment Confirmed - ${data.appointmentDate}`,
      'APPOINTMENT_REMINDER': `Appointment Reminder - Tomorrow at ${data.appointmentTime}`,
      'TEST_DUE_NOTIFICATION': `Backflow Test Due - ${data.deviceSerial}`,
      'INVOICE_NOTIFICATION': `Invoice ${data.invoiceNumber} from Fisher Backflows`,
      'PAYMENT_CONFIRMATION': `Payment Received - Thank You!`,
      'SYSTEM_ALERT': `System Alert: ${data.alertType}`,
      'TECHNICIAN_APPOINTMENT_ASSIGNED': `New Appointment Assigned - ${data.appointmentDate}`,
      'APPOINTMENT_REMINDER_SMS': '',
      'APPOINTMENT_CONFIRMATION_SMS': '',
      'TEST_DUE_NOTIFICATION_SMS': ''
    };

    return subjects[templateId] || 'Notification from Fisher Backflows';
  }

  private setupEventTriggers(): void {
    // Setup automatic triggers for various events
    // This would typically be done through database triggers or event listeners
    
    // Schedule daily test due notifications
    setInterval(() => {
      this.sendDailyTestDueNotifications();
    }, 24 * 60 * 60 * 1000); // Daily

    // Schedule appointment reminders
    setInterval(() => {
      this.sendDailyAppointmentReminders();
    }, 60 * 60 * 1000); // Hourly
  }

  private async sendDailyTestDueNotifications(): Promise<void> {
    try {
      const { data: dueDevices } = await this.supabase
        .from('devices')
        .select('id, customer_id, next_test_date')
        .lte('next_test_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Due within 7 days
        .eq('is_active', true);

      for (const device of dueDevices || []) {
        await this.sendTestDueNotification(device.customer_id, device.id);
      }
    } catch (error) {
      logger.error('Failed to send daily test due notifications', { error });
    }
  }

  private async sendDailyAppointmentReminders(): Promise<void> {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data: appointments } = await this.supabase
        .from('appointments')
        .select('id')
        .eq('scheduled_date', tomorrow.toISOString().split('T')[0])
        .eq('status', 'confirmed');

      for (const appointment of appointments || []) {
        await this.sendAppointmentReminder(appointment.id);
      }
    } catch (error) {
      logger.error('Failed to send daily appointment reminders', { error });
    }
  }

  private getSMSContent(templateId: string, data: Record<string, any>): string {
    const templates: Record<string, string> = {
      'APPOINTMENT_CONFIRMATION': `Fisher Backflows: Your appointment is confirmed for ${data.appointmentDate} at ${data.appointmentTime}. Address: ${data.address}`,
      'APPOINTMENT_REMINDER': `Reminder: Backflow test appointment tomorrow at ${data.appointmentTime}. Fisher Backflows - (253) 555-0123`,
      'TEST_COMPLETE': `Your backflow test is complete! Result: ${data.result}. Invoice sent to email. Thank you! - Fisher Backflows`,
      'PAYMENT_RECEIVED': `Payment confirmed: $${data.amount} received. Thank you! - Fisher Backflows`,
      'PAYMENT_FAILED': `Payment failed for invoice #${data.invoiceNumber}. Please update payment method. - Fisher Backflows`
    };
    
    return templates[templateId] || `Fisher Backflows notification: ${data.message || 'Update available'}`;
  }

  private getPushTitle(templateId: string, data: Record<string, any>): string {
    const titles: Record<string, string> = {
      'APPOINTMENT_CONFIRMATION': 'Appointment Confirmed',
      'APPOINTMENT_REMINDER': 'Appointment Tomorrow',
      'TEST_COMPLETE': 'Test Complete',
      'PAYMENT_RECEIVED': 'Payment Received',
      'PAYMENT_FAILED': 'Payment Failed',
      'INVOICE_DUE': 'Invoice Due Soon'
    };
    
    return titles[templateId] || 'Fisher Backflows Update';
  }

  private getPushBody(templateId: string, data: Record<string, any>): string {
    const bodies: Record<string, string> = {
      'APPOINTMENT_CONFIRMATION': `Your appointment is scheduled for ${data.appointmentDate} at ${data.appointmentTime}`,
      'APPOINTMENT_REMINDER': `Don't forget your backflow test appointment tomorrow at ${data.appointmentTime}`,
      'TEST_COMPLETE': `Your backflow test result: ${data.result}. Invoice has been sent to your email.`,
      'PAYMENT_RECEIVED': `Thank you! We've received your payment of $${data.amount}`,
      'PAYMENT_FAILED': `Payment failed for invoice #${data.invoiceNumber}. Please update your payment method.`,
      'INVOICE_DUE': `Invoice #${data.invoiceNumber} for $${data.amount} is due ${data.dueDate}`
    };
    
    return bodies[templateId] || data.message || 'You have a new update from Fisher Backflows';
  }
}

// Export singleton
export const notificationService = new NotificationService();
export default notificationService;