# Comprehensive Platform Audit Prompt

## Claude, conduct a thorough, truthful audit of the Fisher Backflows platform with these requirements:

### CORE BUSINESS REQUIREMENTS TO VALIDATE:

#### 1. CUSTOMER PORTAL - End-to-End Journey
**Test Path**: Register → Verify Email → Login → Schedule Test → Pay Online → View Results
- Can a real customer complete registration without errors?
- Do they receive working verification emails?
- Can they login after verification?
- Can they schedule a backflow test appointment?
- Can they pay for services online?
- Can they view their test reports and compliance status?
- Can they manage their devices and properties?

#### 2. SCHEDULING SYSTEM - Core Functionality
**Must Work**: Customer booking, technician assignment, calendar integration
- Does the appointment booking system function correctly?
- Can customers see available time slots?
- Can they book, modify, and cancel appointments?
- Does it integrate with technician schedules?
- Does it handle time zones and availability correctly?
- Can technicians see their assigned appointments?

#### 3. PAYMENT PROCESSING - Real Transactions
**Must Work**: Stripe integration, invoice generation, payment tracking
- Is Stripe properly configured and functional?
- Can customers make real payments?
- Are invoices generated correctly?
- Is payment status tracked accurately?
- Can customers view payment history?

#### 4. ADMIN DASHBOARD - Lead Management
**Must Work**: Lead tracking, organization, SaaS prospect identification
- Can admin add new leads effectively?
- Can admin edit existing lead information?
- Are top leads clearly identified and prioritized?
- Are leads properly categorized:
  * Backflow testing service leads
  * SaaS customer prospects (other testers who would use the platform)
- Is lead data organized and searchable?
- Can admin track lead conversion and status?

#### 5. TEAM PORTAL - Multi-Tenant SaaS Capability
**Must Work**: Scalable architecture for multiple testing companies
- Can the team portal support multiple independent businesses?
- Can SaaS customers (other backflow testers) purchase subscriptions?
- Does each SaaS customer get their own isolated data and portal?
- Can they manage their own customers, appointments, and billing?
- Is the multi-tenant architecture secure and scalable?
- Can admin manage multiple SaaS customer accounts?

### TECHNICAL AUDIT REQUIREMENTS:

#### Database & Security
- Are RLS policies properly configured for all tables?
- Is customer data properly isolated between tenants?
- Are all security vulnerabilities addressed?
- Can the database handle multi-tenant architecture?

#### Authentication & Authorization
- Does the complete auth flow work end-to-end?
- Are user roles and permissions properly implemented?
- Can customers, team members, and SaaS customers access appropriate features?

#### Integration Points
- Email service (verification, notifications, receipts)
- Payment processing (Stripe webhooks, error handling)
- Calendar/scheduling integration
- PDF generation for reports and invoices

#### Performance & Scalability
- Can the platform handle multiple SaaS customers simultaneously?
- Are database queries optimized for multi-tenant usage?
- Is the application architecture scalable?

### AUDIT METHODOLOGY:

1. **Start from scratch** - Test as if you're a new user with no context
2. **Follow real user journeys** - Don't just check individual components
3. **Identify blockers vs. polish** - Focus on what prevents core functionality
4. **Test multi-tenancy** - Verify SaaS scalability requirements
5. **Document exact failure points** - No vague "needs work" assessments
6. **Prioritize by business impact** - What blocks revenue vs. what's nice-to-have

### DELIVERABLES REQUIRED:

#### 1. Current State Assessment
- What actually works end-to-end today?
- What is completely broken and blocks core functionality?
- What appears to work but fails under real usage?

#### 2. Categorized Issue List
**CRITICAL (Blocks core business functions):**
- Issues that prevent customers from completing purchases
- Issues that prevent SaaS scaling
- Security vulnerabilities that risk data breaches

**HIGH (Impacts user experience):**
- Issues that make the platform difficult to use
- Performance problems
- Integration failures

**MEDIUM (Polish and optimization):**
- UI/UX improvements
- Performance optimizations
- Feature enhancements

#### 3. Implementation Roadmap
**Phase 1: Core Functionality (Must work for any customers)**
- Customer registration → payment flow
- Scheduling system
- Basic admin dashboard

**Phase 2: SaaS Multi-Tenancy (Enables scaling)**
- Multi-tenant architecture
- Subscription management
- Tenant isolation

**Phase 3: Advanced Features (Revenue optimization)**
- Advanced lead management
- Analytics and reporting
- Advanced integrations

#### 4. Realistic Timeline
- Hours/days required for each phase
- Dependencies between fixes
- What can be done in parallel vs. sequentially

### AUDIT EXECUTION:
Claude, now execute this audit by:
1. Testing every critical user journey end-to-end
2. Identifying exact failure points with specific error messages
3. Assessing multi-tenant capability honestly
4. Creating a prioritized, actionable todo list
5. Providing realistic time estimates for fixes

Be brutally honest about what works vs. what's broken. Focus on enabling real business value, not creating the appearance of progress.