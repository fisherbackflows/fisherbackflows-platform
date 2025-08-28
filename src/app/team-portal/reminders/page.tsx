'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bell,
  Calendar,
  Mail,
  Phone,
  MessageSquare,
  Send,
  Clock,
  Users,
  Settings,
  Plus,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Filter,
  Search,
  RotateCcw,
  Edit,
  Trash2,
  Building2,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface ReminderRule {
  id: string;
  name: string;
  description: string;
  triggerType: 'days_before_due' | 'days_after_due' | 'monthly' | 'custom_date';
  triggerValue: number; // days before/after or day of month
  customerType: 'all' | 'residential' | 'commercial' | 'industrial';
  waterDistrict: 'all' | string;
  contactMethod: 'email' | 'phone' | 'text' | 'mail' | 'all_preferred';
  template: string;
  active: boolean;
  lastRun: string | null;
  nextRun: string | null;
  totalSent: number;
  successRate: number;
  autoSchedule: boolean; // Auto-schedule appointments when sending reminder
  createdDate: string;
}

interface ScheduledReminder {
  id: string;
  ruleId: string;
  ruleName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  contactMethod: 'email' | 'phone' | 'text' | 'mail';
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'sent' | 'delivered' | 'failed' | 'responded';
  message: string;
  sentDate?: string;
  responseDate?: string;
  appointmentScheduled?: boolean;
  devicesDue: {
    type: string;
    serialNumber: string;
    dueDate: string;
  }[];
  retryCount: number;
  lastError?: string;
}

export default function RemindersPage() {
  const [activeTab, setActiveTab] = useState<'rules' | 'scheduled' | 'sent'>('rules');
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');

  useEffect(() => {
    // Load reminder rules and scheduled reminders
    const sampleRules: ReminderRule[] = [
      {
        id: 'rule-1',
        name: '30-Day Test Reminder',
        description: 'Send email reminder 30 days before test due date',
        triggerType: 'days_before_due',
        triggerValue: 30,
        customerType: 'all',
        waterDistrict: 'all',
        contactMethod: 'email',
        template: `Dear {{customerName}},

This is a friendly reminder that your backflow prevention device testing is due on {{dueDate}}.

Device Details:
{{devicesList}}

To schedule your test, please:
- Call us at (253) 278-8692
- Email us at service@fisherbackflows.com
- Book online at fisherbackflows.com

Thank you,
Fisher Backflows`,
        active: true,
        lastRun: '2024-08-20',
        nextRun: '2024-08-25',
        totalSent: 145,
        successRate: 92.5,
        autoSchedule: false,
        createdDate: '2024-01-01'
      },
      {
        id: 'rule-2',
        name: 'Commercial 45-Day Notice',
        description: 'Extended notice for commercial customers',
        triggerType: 'days_before_due',
        triggerValue: 45,
        customerType: 'commercial',
        waterDistrict: 'all',
        contactMethod: 'all_preferred',
        template: `Dear {{customerName}},

Your commercial backflow prevention system requires annual testing in {{daysUntilDue}} days ({{dueDate}}).

As a commercial facility, we recommend scheduling early to ensure compliance with local regulations.

{{devicesList}}

Please contact us to schedule:
📞 (253) 278-8692
📧 service@fisherbackflows.com

Fisher Backflows - Licensed & Certified`,
        active: true,
        lastRun: '2024-08-15',
        nextRun: '2024-08-22',
        totalSent: 89,
        successRate: 94.1,
        autoSchedule: true,
        createdDate: '2024-01-15'
      },
      {
        id: 'rule-3',
        name: 'Overdue Follow-up',
        description: 'Follow up on overdue tests',
        triggerType: 'days_after_due',
        triggerValue: 7,
        customerType: 'all',
        waterDistrict: 'all',
        contactMethod: 'phone',
        template: `URGENT: Your backflow test was due on {{dueDate}} and is now {{daysOverdue}} days overdue.

This is required by law and your water service may be affected.

Please call us immediately at (253) 278-8692 to schedule.`,
        active: true,
        lastRun: '2024-08-18',
        nextRun: '2024-08-25',
        totalSent: 23,
        successRate: 78.3,
        autoSchedule: false,
        createdDate: '2024-02-01'
      }
    ];

    const sampleScheduled: ScheduledReminder[] = [
      {
        id: 'sched-1',
        ruleId: 'rule-1',
        ruleName: '30-Day Test Reminder',
        customerId: '1',
        customerName: 'Johnson Properties LLC',
        customerEmail: 'manager@johnsonproperties.com',
        customerPhone: '(253) 555-0123',
        contactMethod: 'email',
        scheduledDate: '2024-08-26',
        scheduledTime: '09:00',
        status: 'scheduled',
        message: `Dear Johnson Properties LLC,

This is a friendly reminder that your backflow prevention device testing is due on March 15, 2025.

Device Details:
- RP Device (RP-12345-A) at Main Building Entrance
- RP Device (RP-12345-B) at Building B Service Line

To schedule your test, please call us at (253) 278-8692.

Thank you,
Fisher Backflows`,
        devicesDue: [
          { type: 'RP', serialNumber: 'RP-12345-A', dueDate: '2025-03-15' },
          { type: 'RP', serialNumber: 'RP-12345-B', dueDate: '2025-03-15' }
        ],
        retryCount: 0
      },
      {
        id: 'sched-2',
        ruleId: 'rule-3',
        ruleName: 'Overdue Follow-up',
        customerId: '3',
        customerName: 'Parkland Medical Center',
        customerEmail: 'facilities@parklandmedical.com',
        customerPhone: '(253) 555-0125',
        contactMethod: 'phone',
        scheduledDate: '2024-08-25',
        scheduledTime: '10:30',
        status: 'scheduled',
        message: 'URGENT: Your backflow test was due on November 10, 2024 and is now 15 days overdue.',
        devicesDue: [
          { type: 'RP', serialNumber: 'RP-11111', dueDate: '2024-11-10' }
        ],
        retryCount: 1
      },
      {
        id: 'sched-3',
        ruleId: 'rule-1',
        ruleName: '30-Day Test Reminder',
        customerId: '2',
        customerName: 'Smith Residence',
        customerEmail: 'john.smith@gmail.com',
        customerPhone: '(253) 555-0124',
        contactMethod: 'email',
        scheduledDate: '2024-08-20',
        scheduledTime: '08:00',
        status: 'sent',
        message: 'Reminder: Your backflow test is due January 20, 2025.',
        sentDate: '2024-08-20',
        devicesDue: [
          { type: 'PVB', serialNumber: 'PVB-67890', dueDate: '2025-01-20' }
        ],
        retryCount: 0,
        appointmentScheduled: false
      }
    ];

    setTimeout(() => {
      setRules(sampleRules);
      setScheduledReminders(sampleScheduled);
      setLoading(false);
    }, 500);
  }, []);

  const toggleRuleStatus = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, active: !rule.active } : rule
    ));
  };

  const runRuleNow = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    try {
      // Simulate running the rule
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update rule stats
      setRules(prev => prev.map(r => 
        r.id === ruleId 
          ? { ...r, lastRun: new Date().toISOString().split('T')[0], totalSent: r.totalSent + 3 }
          : r
      ));
      
      alert(`Rule "${rule.name}" executed successfully! 3 reminders scheduled.`);
    } catch (error) {
      alert('Error running rule. Please try again.');
    }
  };

  const sendReminderNow = async (reminderId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setScheduledReminders(prev => prev.map(reminder => 
        reminder.id === reminderId 
          ? { 
              ...reminder, 
              status: 'sent', 
              sentDate: new Date().toISOString().split('T')[0] 
            }
          : reminder
      ));
      
      alert('Reminder sent successfully!');
    } catch (error) {
      alert('Error sending reminder. Please try again.');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getReminderStats = () => {
    const total = scheduledReminders.length;
    const scheduled = scheduledReminders.filter(r => r.status === 'scheduled').length;
    const sent = scheduledReminders.filter(r => r.status === 'sent' || r.status === 'delivered').length;
    const failed = scheduledReminders.filter(r => r.status === 'failed').length;
    
    return { total, scheduled, sent, failed };
  };

  const stats = getReminderStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reminder system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Bell className="h-6 w-6 mr-2" />
              Automated Reminders
            </h1>
            <Button size="sm" asChild>
              <Link href="/app/reminders/new">
                <Plus className="h-4 w-4 mr-2" />
                New Rule
              </Link>
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-blue-700">{rules.filter(r => r.active).length}</div>
              <div className="text-xs text-blue-600">Active Rules</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-yellow-700">{stats.scheduled}</div>
              <div className="text-xs text-yellow-600">Scheduled</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-700">{stats.sent}</div>
              <div className="text-xs text-green-600">Sent Today</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-red-700">{stats.failed}</div>
              <div className="text-xs text-red-600">Failed</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'rules', label: 'Automation Rules', icon: Settings },
              { key: 'scheduled', label: 'Scheduled', icon: Clock },
              { key: 'sent', label: 'Sent History', icon: CheckCircle }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* Automation Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rule.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {rule.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      {rule.autoSchedule && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          AUTO-SCHEDULE
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{rule.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRuleStatus(rule.id)}
                    >
                      {rule.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runRuleNow(rule.id)}
                      disabled={!rule.active}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="text-sm">
                    <span className="text-gray-500">Trigger:</span>
                    <span className="ml-1 font-medium">
                      {rule.triggerValue} days {rule.triggerType.includes('before') ? 'before' : 'after'} due
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Contact:</span>
                    <span className="ml-1 font-medium capitalize">{rule.contactMethod.replace('_', ' ')}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Customers:</span>
                    <span className="ml-1 font-medium capitalize">{rule.customerType}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Success Rate:</span>
                    <span className="ml-1 font-medium text-green-600">{rule.successRate}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>
                    <span>Last run: {formatDate(rule.lastRun)}</span>
                    <span className="mx-2">•</span>
                    <span>Total sent: {rule.totalSent}</span>
                  </div>
                  <div>
                    Next run: {formatDate(rule.nextRun)}
                  </div>
                </div>

                {/* Preview of message template */}
                <div className="mt-3 bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">Message Preview:</div>
                  <div className="text-sm text-gray-600 line-clamp-3">
                    {rule.template.split('\n')[0]}...
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t mt-3">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-1" />
                      Template
                    </Button>
                  </div>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}

            {rules.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No automation rules</h3>
                <p className="text-gray-500 mb-4">Create your first rule to start sending automated reminders</p>
                <Button asChild>
                  <Link href="/app/reminders/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Rule
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Scheduled Reminders Tab */}
        {activeTab === 'scheduled' && (
          <div className="space-y-3">
            {scheduledReminders.filter(r => r.status === 'scheduled').map((reminder) => (
              <div key={reminder.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{reminder.customerName}</h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {reminder.contactMethod.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">Rule: {reminder.ruleName}</p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-900 font-medium">
                      {formatDate(reminder.scheduledDate)} at {reminder.scheduledTime}
                    </div>
                    {reminder.retryCount > 0 && (
                      <div className="text-red-600">Retry #{reminder.retryCount}</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-500">Contact:</span>
                    <span className="ml-1">
                      {reminder.contactMethod === 'email' ? reminder.customerEmail : reminder.customerPhone}
                    </span>
                  </div>

                  <div className="text-sm">
                    <span className="text-gray-500">Devices Due:</span>
                    <div className="ml-1">
                      {reminder.devicesDue.map((device, idx) => (
                        <div key={idx} className="text-gray-600">
                          {device.type} ({device.serialNumber}) - Due {formatDate(device.dueDate)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mt-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">Message:</div>
                    <div className="text-sm text-gray-600 line-clamp-4">
                      {reminder.message}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t mt-3">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => sendReminderNow(reminder.id)}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Send Now
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                  <Button size="sm" variant="outline" className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sent History Tab */}
        {activeTab === 'sent' && (
          <div className="space-y-3">
            {scheduledReminders.filter(r => ['sent', 'delivered', 'failed'].includes(r.status)).map((reminder) => (
              <div key={reminder.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{reminder.customerName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        reminder.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        reminder.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {reminder.status.toUpperCase()}
                      </span>
                      {reminder.appointmentScheduled && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          APPOINTMENT BOOKED
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">
                      Sent {formatDate(reminder.sentDate)} via {reminder.contactMethod}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <div>Rule: {reminder.ruleName}</div>
                  <div>Contact: {reminder.contactMethod === 'email' ? reminder.customerEmail : reminder.customerPhone}</div>
                </div>

                {reminder.lastError && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 rounded p-2">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    {reminder.lastError}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-5">
          <Link href="/app" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <div className="h-6 w-6 bg-gray-400 rounded"></div>
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/app/customers" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <Users className="h-6 w-6" />
            <span className="text-xs">Customers</span>
          </Link>
          <Link href="/app/test-report" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <Plus className="h-6 w-4" />
            <span className="text-xs">Test</span>
          </Link>
          <Link href="/app/schedule" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <Calendar className="h-6 w-6" />
            <span className="text-xs">Schedule</span>
          </Link>
          <Link href="/app/more" className="flex flex-col items-center py-2 px-1 text-blue-600 bg-blue-50">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
              <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
              <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
            </div>
            <span className="text-xs font-medium">More</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}