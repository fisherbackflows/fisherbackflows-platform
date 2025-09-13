/**
 * Complete Site Structure - Fisher Backflows Platform
 * All 82 pages organized by category with metadata
 */

export interface PageInfo {
  path: string;
  title: string;
  description: string;
  category: 'homepage' | 'customer' | 'team' | 'admin' | 'field' | 'api' | 'app';
  theme: 'default' | 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  status: 'active' | 'development' | 'maintenance';
  requiresAuth: boolean;
  components?: string[];
  lastModified?: string;
}

export const siteStructure: PageInfo[] = [
  // ============================================================================
  // HOMEPAGE & CORE (6 pages) - Default theme
  // ============================================================================
  {
    path: '/',
    title: 'Homepage',
    description: 'Main landing page with hero section and navigation',
    category: 'homepage',
    theme: 'default',
    status: 'active',
    requiresAuth: false,
    components: ['HeroSection', 'NavigationHeader', 'ClientButton']
  },
  {
    path: '/login',
    title: 'Login',
    description: 'Main login portal selector',
    category: 'homepage',
    theme: 'default',
    status: 'active',
    requiresAuth: false,
    components: ['LoginForm']
  },
  {
    path: '/maintenance',
    title: 'Maintenance',
    description: 'System maintenance page',
    category: 'homepage',
    theme: 'default',
    status: 'active',
    requiresAuth: false
  },
  {
    path: '/test-navigation',
    title: 'Test Navigation',
    description: 'Navigation testing page',
    category: 'homepage',
    theme: 'default',
    status: 'development',
    requiresAuth: false
  },
  {
    path: '/app',
    title: 'App Landing',
    description: 'Application main entry',
    category: 'app',
    theme: 'default',
    status: 'active',
    requiresAuth: false
  },
  {
    path: '/app/dashboard',
    title: 'App Dashboard',
    description: 'Application dashboard',
    category: 'app',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },

  // ============================================================================
  // CUSTOMER PORTAL (10 pages) - Blue theme
  // ============================================================================
  {
    path: '/portal',
    title: 'Customer Portal',
    description: 'Customer portal landing',
    category: 'customer',
    theme: 'blue',
    status: 'active',
    requiresAuth: true,
    components: ['Navigation']
  },
  {
    path: '/portal/dashboard',
    title: 'Customer Dashboard',
    description: 'Customer account dashboard with unified design',
    category: 'customer',
    theme: 'blue',
    status: 'active',
    requiresAuth: true,
    components: ['UnifiedLayout', 'UnifiedCard', 'UnifiedButton']
  },
  {
    path: '/portal/devices',
    title: 'Devices',
    description: 'Manage backflow devices',
    category: 'customer',
    theme: 'blue',
    status: 'active',
    requiresAuth: true,
    components: ['DeviceForm']
  },
  {
    path: '/portal/schedule',
    title: 'Schedule',
    description: 'Schedule testing appointments',
    category: 'customer',
    theme: 'blue',
    status: 'active',
    requiresAuth: true,
    components: ['Calendar']
  },
  {
    path: '/portal/reports',
    title: 'Reports',
    description: 'View test reports',
    category: 'customer',
    theme: 'blue',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/portal/billing',
    title: 'Billing',
    description: 'Billing and payment history',
    category: 'customer',
    theme: 'blue',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/portal/pay',
    title: 'Payment',
    description: 'Make a payment',
    category: 'customer',
    theme: 'blue',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/portal/register',
    title: 'Register',
    description: 'Create customer account',
    category: 'customer',
    theme: 'blue',
    status: 'active',
    requiresAuth: false
  },
  {
    path: '/portal/forgot-password',
    title: 'Forgot Password',
    description: 'Password recovery',
    category: 'customer',
    theme: 'blue',
    status: 'active',
    requiresAuth: false,
    components: ['ForgotPasswordForm']
  },
  {
    path: '/portal/reset-password',
    title: 'Reset Password',
    description: 'Reset password with token',
    category: 'customer',
    theme: 'blue',
    status: 'active',
    requiresAuth: false,
    components: ['ResetPasswordForm']
  },

  // ============================================================================
  // TESTER PORTAL (20 pages) - Green theme
  // ============================================================================
  {
    path: '/team-portal',
    title: 'Tester Portal',
    description: 'Tester portal landing',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/dashboard',
    title: 'Team Dashboard',
    description: 'Team operations dashboard',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/customers',
    title: 'Customers',
    description: 'Customer management',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/customers/new',
    title: 'New Customer',
    description: 'Add new customer',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/customers/[id]',
    title: 'Customer Details',
    description: 'View customer details',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/customers/[id]/edit',
    title: 'Edit Customer',
    description: 'Edit customer information',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/customers/database',
    title: 'Customer Database',
    description: 'Full customer database',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/schedule',
    title: 'Team Schedule',
    description: 'Manage team schedules',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/schedule/new',
    title: 'New Schedule',
    description: 'Create new schedule',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/invoices',
    title: 'Invoices',
    description: 'Invoice management',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/invoices/new',
    title: 'New Invoice',
    description: 'Create new invoice',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/invoices/[id]',
    title: 'Invoice Details',
    description: 'View invoice details',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/invoices/[id]/edit',
    title: 'Edit Invoice',
    description: 'Edit invoice',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/test-report',
    title: 'Test Report',
    description: 'Complete test reports',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/district-reports',
    title: 'District Reports',
    description: 'Water district reporting',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/reminders',
    title: 'Reminders',
    description: 'Customer reminders',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/reminders/new',
    title: 'New Reminder',
    description: 'Create new reminder',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/tester',
    title: 'Tester',
    description: 'Tester tools',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/settings',
    title: 'Settings',
    description: 'Team settings',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/more',
    title: 'More Options',
    description: 'Additional team options',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },

  // Additional Tester Portal Pages
  {
    path: '/team-portal/export',
    title: 'Export Data',
    description: 'Export system data',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/import',
    title: 'Import Data',
    description: 'Import system data',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/labels',
    title: 'Labels',
    description: 'Print mailing labels',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/backup',
    title: 'Backup',
    description: 'System backup',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/help',
    title: 'Help',
    description: 'Team help documentation',
    category: 'team',
    theme: 'green',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/team-portal/instagram',
    title: 'Instagram',
    description: 'Social media integration',
    category: 'team',
    theme: 'green',
    status: 'development',
    requiresAuth: true
  },

  // ============================================================================
  // ADMIN PAGES (2 pages) - Purple theme
  // ============================================================================
  {
    path: '/admin/dashboard',
    title: 'Admin Dashboard',
    description: 'System administration dashboard',
    category: 'admin',
    theme: 'purple',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/admin/analytics',
    title: 'Analytics',
    description: 'System analytics and metrics',
    category: 'admin',
    theme: 'purple',
    status: 'active',
    requiresAuth: true
  },

  // ============================================================================
  // FIELD PAGES (4 pages) - Yellow theme
  // ============================================================================
  {
    path: '/field',
    title: 'Field Portal',
    description: 'Field technician portal',
    category: 'field',
    theme: 'yellow',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/field/login',
    title: 'Field Login',
    description: 'Field technician login',
    category: 'field',
    theme: 'yellow',
    status: 'active',
    requiresAuth: false
  },
  {
    path: '/field/dashboard',
    title: 'Field Dashboard',
    description: 'Field operations dashboard',
    category: 'field',
    theme: 'yellow',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/field/test/[appointmentId]',
    title: 'Field Test',
    description: 'Complete field test',
    category: 'field',
    theme: 'yellow',
    status: 'active',
    requiresAuth: true
  },

  // ============================================================================
  // API ROUTES (40 endpoints)
  // ============================================================================
  {
    path: '/api/health',
    title: 'Health Check',
    description: 'System health status',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: false
  },
  {
    path: '/api/test',
    title: 'Test Endpoint',
    description: 'Testing endpoint',
    category: 'api',
    theme: 'default',
    status: 'development',
    requiresAuth: false
  },
  
  // Auth APIs
  {
    path: '/api/auth/login',
    title: 'Auth Login',
    description: 'User authentication',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: false
  },
  {
    path: '/api/auth/register',
    title: 'Auth Register',
    description: 'User registration',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: false
  },
  {
    path: '/api/auth/forgot-password',
    title: 'Forgot Password API',
    description: 'Password recovery',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: false
  },
  {
    path: '/api/auth/reset-password',
    title: 'Reset Password API',
    description: 'Password reset',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: false
  },
  {
    path: '/api/auth/verify-reset',
    title: 'Verify Reset',
    description: 'Verify reset token',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: false
  },
  {
    path: '/api/auth/portal',
    title: 'Portal Auth',
    description: 'Portal authentication',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: false
  },

  // Team APIs
  {
    path: '/api/team/auth/login',
    title: 'Team Login',
    description: 'Team authentication',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: false
  },
  {
    path: '/api/team/auth/logout',
    title: 'Team Logout',
    description: 'Team logout',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/api/team/auth/me',
    title: 'Team Profile',
    description: 'Current team member',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },

  // Customer APIs
  {
    path: '/api/customers',
    title: 'Customers API',
    description: 'Customer management',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/api/customers/[id]',
    title: 'Customer API',
    description: 'Single customer operations',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },

  // Appointment APIs
  {
    path: '/api/appointments',
    title: 'Appointments API',
    description: 'Appointment management',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/api/appointments/[id]',
    title: 'Appointment API',
    description: 'Single appointment',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },

  // Calendar API
  {
    path: '/api/calendar/available-dates',
    title: 'Available Dates',
    description: 'Calendar availability',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },

  // Invoice API
  {
    path: '/api/invoices',
    title: 'Invoices API',
    description: 'Invoice management',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },

  // Test Report APIs
  {
    path: '/api/test-reports',
    title: 'Test Reports API',
    description: 'Test report management',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/api/test-reports/complete',
    title: 'Complete Test',
    description: 'Complete test report',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },

  // Automation APIs
  {
    path: '/api/automation/engine',
    title: 'Automation Engine',
    description: 'Core automation system',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/api/automation/email',
    title: 'Email Automation',
    description: 'Automated email system',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/api/automation/payments',
    title: 'Payment Automation',
    description: 'Automated payments',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/api/automation/orchestrator',
    title: 'Orchestrator',
    description: 'Workflow orchestration',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/api/automation/water-department',
    title: 'Water Department',
    description: 'Water dept integration',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },

  // Notification APIs
  {
    path: '/api/notifications/send',
    title: 'Send Notification',
    description: 'Send notifications',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/api/notifications/track',
    title: 'Track Notification',
    description: 'Track notifications',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },

  // Admin APIs
  {
    path: '/api/admin/activity',
    title: 'Admin Activity',
    description: 'System activity logs',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/api/admin/analytics',
    title: 'Admin Analytics',
    description: 'System analytics',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/api/admin/bypass',
    title: 'Admin Bypass',
    description: 'Admin bypass controls',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/api/admin/metrics',
    title: 'Admin Metrics',
    description: 'System metrics',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/api/admin/private-mode',
    title: 'Private Mode',
    description: 'Private mode controls',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },

  // Monitoring APIs
  {
    path: '/api/monitoring/dashboard',
    title: 'Monitoring Dashboard',
    description: 'System monitoring',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },
  {
    path: '/api/security/status',
    title: 'Security Status',
    description: 'Security monitoring',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },

  // File APIs
  {
    path: '/api/files/upload',
    title: 'File Upload',
    description: 'File upload handler',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: true
  },

  // Error API
  {
    path: '/api/errors/report',
    title: 'Error Reporting',
    description: 'Error reporting endpoint',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: false
  },

  // Lead Generation
  {
    path: '/api/leads/generate',
    title: 'Lead Generation',
    description: 'Generate new leads',
    category: 'api',
    theme: 'default',
    status: 'development',
    requiresAuth: true
  },

  // Stripe Webhook
  {
    path: '/api/stripe/webhook',
    title: 'Stripe Webhook',
    description: 'Stripe payment webhook',
    category: 'api',
    theme: 'default',
    status: 'active',
    requiresAuth: false
  }
];

// Helper functions for filtering and searching
export function getPagesByCategory(category: PageInfo['category']): PageInfo[] {
  return siteStructure.filter(page => page.category === category);
}

export function getPagesByTheme(theme: PageInfo['theme']): PageInfo[] {
  return siteStructure.filter(page => page.theme === theme);
}

export function getPagesByStatus(status: PageInfo['status']): PageInfo[] {
  return siteStructure.filter(page => page.status === status);
}

export function searchPages(query: string): PageInfo[] {
  const lowercaseQuery = query.toLowerCase();
  return siteStructure.filter(page => 
    page.title.toLowerCase().includes(lowercaseQuery) ||
    page.description.toLowerCase().includes(lowercaseQuery) ||
    page.path.toLowerCase().includes(lowercaseQuery)
  );
}

export function getPageByPath(path: string): PageInfo | undefined {
  return siteStructure.find(page => page.path === path);
}

// Statistics
export const siteStatistics = {
  totalPages: siteStructure.length,
  byCategory: {
    homepage: getPagesByCategory('homepage').length,
    customer: getPagesByCategory('customer').length,
    team: getPagesByCategory('team').length,
    admin: getPagesByCategory('admin').length,
    field: getPagesByCategory('field').length,
    api: getPagesByCategory('api').length,
    app: getPagesByCategory('app').length
  },
  byStatus: {
    active: getPagesByStatus('active').length,
    development: getPagesByStatus('development').length,
    maintenance: getPagesByStatus('maintenance').length
  },
  requiresAuth: siteStructure.filter(page => page.requiresAuth).length,
  publicPages: siteStructure.filter(page => !page.requiresAuth).length
};