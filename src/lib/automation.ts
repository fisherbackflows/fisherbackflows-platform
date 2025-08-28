// Automated reminder and follow-up system for Fisher Backflows
import { createClientComponentClient } from '@/lib/supabase'
import { NotificationTemplates } from './notifications'

export interface ReminderRule {
  id: string
  name: string
  description: string
  trigger: 'days_before' | 'days_after' | 'overdue' | 'status_change'
  triggerValue: number // Number of days for time-based triggers
  conditions: {
    customerStatus?: string[]
    deviceStatus?: string[]
    testResult?: string[]
    invoiceStatus?: string[]
    appointmentStatus?: string[]
  }
  actions: ReminderAction[]
  isActive: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface ReminderAction {
  type: 'email' | 'sms' | 'push_notification' | 'schedule_appointment' | 'create_task'
  template: string
  data: Record<string, any>
}

export interface ScheduledReminder {
  id: string
  ruleId: string
  customerId: string
  scheduledDate: string
  executedDate?: string
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  attempts: number
  lastError?: string
}

export class AutomationEngine {
  private supabase = createClientComponentClient()
  private reminderRules: ReminderRule[] = []

  constructor() {
    this.initializeDefaultRules()
  }

  // Initialize default reminder rules
  private initializeDefaultRules() {
    this.reminderRules = [
      {
        id: 'annual_test_reminder_30',
        name: '30-Day Test Reminder',
        description: 'Remind customers 30 days before their annual test is due',
        trigger: 'days_before',
        triggerValue: 30,
        conditions: {
          customerStatus: ['active']
        },
        actions: [
          {
            type: 'email',
            template: 'annual_test_reminder_30_days',
            data: {}
          },
          {
            type: 'push_notification',
            template: 'reminder_due',
            data: {}
          }
        ],
        isActive: true,
        priority: 'medium'
      },
      {
        id: 'annual_test_reminder_7',
        name: '7-Day Test Reminder',
        description: 'Remind customers 7 days before their annual test is due',
        trigger: 'days_before',
        triggerValue: 7,
        conditions: {
          customerStatus: ['active']
        },
        actions: [
          {
            type: 'email',
            template: 'annual_test_reminder_7_days',
            data: {}
          },
          {
            type: 'sms',
            template: 'test_reminder_sms',
            data: {}
          }
        ],
        isActive: true,
        priority: 'high'
      },
      {
        id: 'overdue_test_reminder',
        name: 'Overdue Test Reminder',
        description: 'Remind customers when their test is overdue',
        trigger: 'overdue',
        triggerValue: 0,
        conditions: {
          customerStatus: ['active']
        },
        actions: [
          {
            type: 'email',
            template: 'overdue_test_notice',
            data: {}
          },
          {
            type: 'push_notification',
            template: 'system_alert',
            data: { severity: 'warning' }
          },
          {
            type: 'create_task',
            template: 'follow_up_overdue_customer',
            data: {}
          }
        ],
        isActive: true,
        priority: 'urgent'
      },
      {
        id: 'failed_test_follow_up',
        name: 'Failed Test Follow-up',
        description: 'Follow up with customers who failed their backflow test',
        trigger: 'status_change',
        triggerValue: 1,
        conditions: {
          testResult: ['Failed', 'Needs Repair']
        },
        actions: [
          {
            type: 'email',
            template: 'failed_test_follow_up',
            data: {}
          },
          {
            type: 'create_task',
            template: 'schedule_repair_consultation',
            data: {}
          }
        ],
        isActive: true,
        priority: 'high'
      },
      {
        id: 'payment_overdue_reminder',
        name: 'Payment Overdue Reminder',
        description: 'Remind customers about overdue invoices',
        trigger: 'overdue',
        triggerValue: 30,
        conditions: {
          invoiceStatus: ['sent', 'pending']
        },
        actions: [
          {
            type: 'email',
            template: 'payment_overdue_notice',
            data: {}
          },
          {
            type: 'push_notification',
            template: 'overdueInvoice',
            data: {}
          }
        ],
        isActive: true,
        priority: 'high'
      },
      {
        id: 'appointment_confirmation',
        name: 'Appointment Confirmation',
        description: 'Send appointment confirmation 24 hours before scheduled test',
        trigger: 'days_before',
        triggerValue: 1,
        conditions: {
          appointmentStatus: ['scheduled', 'confirmed']
        },
        actions: [
          {
            type: 'email',
            template: 'appointment_confirmation',
            data: {}
          },
          {
            type: 'sms',
            template: 'appointment_reminder_sms',
            data: {}
          }
        ],
        isActive: true,
        priority: 'medium'
      }
    ]
  }

  // Run the automation engine - check all rules and schedule/execute actions
  async runAutomationCycle(): Promise<{ processed: number; scheduled: number; errors: number }> {
    console.log('🤖 Running automation cycle...')
    
    let processed = 0
    let scheduled = 0
    let errors = 0

    try {
      // Process each rule
      for (const rule of this.reminderRules.filter(r => r.isActive)) {
        try {
          const result = await this.processRule(rule)
          processed++
          scheduled += result.scheduled
        } catch (error) {
          console.error(`Error processing rule ${rule.id}:`, error)
          errors++
        }
      }

      // Execute pending scheduled reminders
      const executionResult = await this.executeScheduledReminders()
      processed += executionResult.executed
      errors += executionResult.errors

      console.log(`✅ Automation cycle complete: ${processed} processed, ${scheduled} scheduled, ${errors} errors`)

      return { processed, scheduled, errors }

    } catch (error) {
      console.error('Error in automation cycle:', error)
      return { processed, scheduled, errors: errors + 1 }
    }
  }

  // Process a specific rule and find matching conditions
  private async processRule(rule: ReminderRule): Promise<{ scheduled: number }> {
    let scheduled = 0

    try {
      // Get candidates based on rule trigger
      const candidates = await this.findRuleCandidates(rule)
      
      for (const candidate of candidates) {
        // Check if reminder already exists for this candidate and rule
        const existing = await this.checkExistingReminder(rule.id, candidate.id)
        if (existing) continue

        // Schedule the reminder
        await this.scheduleReminder(rule, candidate)
        scheduled++
      }

    } catch (error) {
      console.error(`Error processing rule ${rule.name}:`, error)
      throw error
    }

    return { scheduled }
  }

  // Find candidates that match the rule conditions
  private async findRuleCandidates(rule: ReminderRule): Promise<any[]> {
    const candidates = []

    switch (rule.trigger) {
      case 'days_before':
        candidates.push(...await this.findDaysBeforeCandidates(rule))
        break
      
      case 'days_after':
        candidates.push(...await this.findDaysAfterCandidates(rule))
        break
      
      case 'overdue':
        candidates.push(...await this.findOverdueCandidates(rule))
        break
      
      case 'status_change':
        candidates.push(...await this.findStatusChangeCandidates(rule))
        break
    }

    // Filter by conditions
    return this.filterByConditions(candidates, rule.conditions)
  }

  private async findDaysBeforeCandidates(rule: ReminderRule): Promise<any[]> {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + rule.triggerValue)
    
    const { data: customers } = await this.supabase
      .from('customers')
      .select('*')
      .eq('next_test_date', targetDate.toISOString().split('T')[0])
    
    return customers || []
  }

  private async findDaysAfterCandidates(rule: ReminderRule): Promise<any[]> {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - rule.triggerValue)
    
    const { data: testReports } = await this.supabase
      .from('test_reports')
      .select(`
        *,
        customers (*)
      `)
      .eq('test_date', targetDate.toISOString().split('T')[0])
    
    return testReports?.map(r => r.customers).filter(Boolean) || []
  }

  private async findOverdueCandidates(rule: ReminderRule): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0]
    
    // Find overdue tests
    const { data: customers } = await this.supabase
      .from('customers')
      .select('*')
      .lt('next_test_date', today)
      .in('status', rule.conditions.customerStatus || ['active'])
    
    return customers || []
  }

  private async findStatusChangeCandidates(rule: ReminderRule): Promise<any[]> {
    // This would typically involve monitoring status change events
    // For now, we'll find recent status changes
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    
    const { data: recentTests } = await this.supabase
      .from('test_reports')
      .select(`
        *,
        customers (*)
      `)
      .gte('created_at', oneDayAgo.toISOString())
      .in('test_result', rule.conditions.testResult || [])
    
    return recentTests?.map(r => r.customers).filter(Boolean) || []
  }

  private filterByConditions(candidates: any[], conditions: ReminderRule['conditions']): any[] {
    return candidates.filter(candidate => {
      if (conditions.customerStatus && !conditions.customerStatus.includes(candidate.status)) {
        return false
      }
      
      // Add more condition filters as needed
      return true
    })
  }

  private async checkExistingReminder(ruleId: string, customerId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('scheduled_reminders')
      .select('id')
      .eq('rule_id', ruleId)
      .eq('customer_id', customerId)
      .eq('status', 'pending')
      .single()
    
    return !!data
  }

  private async scheduleReminder(rule: ReminderRule, customer: any): Promise<void> {
    const scheduledDate = new Date()
    
    // Calculate when to execute the reminder
    if (rule.trigger === 'days_before') {
      // Execute immediately for "days before" rules
    } else {
      // Add any delay logic here
    }

    const reminderData = {
      rule_id: rule.id,
      customer_id: customer.id,
      scheduled_date: scheduledDate.toISOString(),
      status: 'pending',
      attempts: 0,
      rule_name: rule.name,
      customer_name: customer.name,
      customer_email: customer.email,
      priority: rule.priority
    }

    await this.supabase
      .from('scheduled_reminders')
      .insert(reminderData)

    console.log(`📅 Scheduled reminder: ${rule.name} for ${customer.name}`)
  }

  private async executeScheduledReminders(): Promise<{ executed: number; errors: number }> {
    let executed = 0
    let errors = 0

    try {
      // Get pending reminders that are due
      const { data: pendingReminders } = await this.supabase
        .from('scheduled_reminders')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_date', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('scheduled_date', { ascending: true })
        .limit(50)

      for (const reminder of pendingReminders || []) {
        try {
          await this.executeReminder(reminder)
          executed++
          
          // Mark as sent
          await this.supabase
            .from('scheduled_reminders')
            .update({ 
              status: 'sent', 
              executed_date: new Date().toISOString() 
            })
            .eq('id', reminder.id)

        } catch (error) {
          console.error(`Error executing reminder ${reminder.id}:`, error)
          errors++
          
          // Update attempts and error
          await this.supabase
            .from('scheduled_reminders')
            .update({ 
              attempts: reminder.attempts + 1,
              last_error: error.message,
              status: reminder.attempts >= 3 ? 'failed' : 'pending'
            })
            .eq('id', reminder.id)
        }
      }

    } catch (error) {
      console.error('Error executing scheduled reminders:', error)
      errors++
    }

    return { executed, errors }
  }

  private async executeReminder(reminder: ScheduledReminder): Promise<void> {
    const rule = this.reminderRules.find(r => r.id === reminder.ruleId)
    if (!rule) {
      throw new Error(`Rule not found: ${reminder.ruleId}`)
    }

    // Execute each action in the rule
    for (const action of rule.actions) {
      await this.executeAction(action, reminder, rule)
    }

    console.log(`✅ Executed reminder: ${rule.name} for customer ${reminder.customerId}`)
  }

  private async executeAction(action: ReminderAction, reminder: ScheduledReminder, rule: ReminderRule): Promise<void> {
    switch (action.type) {
      case 'push_notification':
        await this.sendPushNotification(action, reminder, rule)
        break
      
      case 'email':
        await this.sendEmailNotification(action, reminder, rule)
        break
      
      case 'sms':
        await this.sendSMSNotification(action, reminder, rule)
        break
      
      case 'create_task':
        await this.createTask(action, reminder, rule)
        break
      
      case 'schedule_appointment':
        await this.scheduleAppointment(action, reminder, rule)
        break
    }
  }

  private async sendPushNotification(action: ReminderAction, reminder: ScheduledReminder, rule: ReminderRule): Promise<void> {
    try {
      let notification

      switch (action.template) {
        case 'reminder_due':
          notification = NotificationTemplates.reminderDue(
            reminder.customerName || 'Customer',
            'Annual Backflow Test',
            new Date(reminder.scheduledDate).toLocaleDateString()
          )
          break
        
        case 'system_alert':
          notification = NotificationTemplates.systemAlert(
            `Customer ${reminder.customerName} has an overdue test`,
            action.data.severity || 'warning'
          )
          break
        
        default:
          notification = NotificationTemplates.systemAlert(rule.description)
      }

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      })

      if (!response.ok) {
        throw new Error(`Push notification failed: ${response.statusText}`)
      }

    } catch (error) {
      console.error('Error sending push notification:', error)
      throw error
    }
  }

  private async sendEmailNotification(action: ReminderAction, reminder: ScheduledReminder, rule: ReminderRule): Promise<void> {
    // Email implementation would go here
    // For now, we'll log the action
    console.log(`📧 Email notification: ${action.template} to ${reminder.customerEmail}`)
  }

  private async sendSMSNotification(action: ReminderAction, reminder: ScheduledReminder, rule: ReminderRule): Promise<void> {
    // SMS implementation would go here
    console.log(`📱 SMS notification: ${action.template} to customer`)
  }

  private async createTask(action: ReminderAction, reminder: ScheduledReminder, rule: ReminderRule): Promise<void> {
    const taskData = {
      title: `${rule.name}: ${reminder.customerName}`,
      description: rule.description,
      customer_id: reminder.customerId,
      type: action.template,
      priority: rule.priority,
      status: 'pending',
      created_date: new Date().toISOString()
    }

    await this.supabase
      .from('tasks')
      .insert(taskData)

    console.log(`📋 Created task: ${taskData.title}`)
  }

  private async scheduleAppointment(action: ReminderAction, reminder: ScheduledReminder, rule: ReminderRule): Promise<void> {
    // Auto-scheduling logic would go here
    console.log(`📅 Auto-scheduled appointment for ${reminder.customerName}`)
  }

  // Public method to start the automation engine
  async start(): Promise<void> {
    console.log('🚀 Starting Fisher Backflows Automation Engine')
    
    // Initial run
    await this.runAutomationCycle()
    
    // Schedule regular runs (every hour)
    setInterval(async () => {
      await this.runAutomationCycle()
    }, 60 * 60 * 1000) // 1 hour
  }

  // Public method to add custom rules
  async addRule(rule: Omit<ReminderRule, 'id'>): Promise<ReminderRule> {
    const newRule: ReminderRule = {
      ...rule,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    this.reminderRules.push(newRule)
    
    // Save to database
    await this.supabase
      .from('reminder_rules')
      .insert(newRule)
    
    return newRule
  }

  // Get automation statistics
  async getStats(): Promise<{
    totalRules: number
    activeRules: number
    pendingReminders: number
    sentToday: number
    failedToday: number
  }> {
    const today = new Date().toISOString().split('T')[0]
    
    const [pending, sentToday, failedToday] = await Promise.all([
      this.supabase.from('scheduled_reminders').select('id', { count: 'exact' }).eq('status', 'pending'),
      this.supabase.from('scheduled_reminders').select('id', { count: 'exact' }).eq('status', 'sent').gte('executed_date', today),
      this.supabase.from('scheduled_reminders').select('id', { count: 'exact' }).eq('status', 'failed').gte('created_at', today)
    ])

    return {
      totalRules: this.reminderRules.length,
      activeRules: this.reminderRules.filter(r => r.isActive).length,
      pendingReminders: pending.count || 0,
      sentToday: sentToday.count || 0,
      failedToday: failedToday.count || 0
    }
  }
}

// Global automation engine instance with lazy initialization
let _automationEngine: AutomationEngine | null = null

export function getAutomationEngine(): AutomationEngine {
  if (!_automationEngine) {
    _automationEngine = new AutomationEngine()
  }
  return _automationEngine
}