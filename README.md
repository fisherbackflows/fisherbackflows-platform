# Fisher Backflows Platform

A comprehensive backflow testing management platform serving customers, testing companies, and administrators.

## 🌐 Live Platform
**Production URL**: https://fisherbackflows.com

## 🏗️ Platform Architecture

### 1. Customer Portal (`/portal/*`)
For property owners who need backflow testing:
- **Company Directory**: Find certified testing companies by location
- **Account Management**: Registration, login, profile management  
- **Device Management**: Track backflow prevention devices
- **Scheduling**: Book testing appointments online
- **Billing**: Secure online payments via Stripe
- **Reports**: Access test reports and compliance certificates
- **Upload System**: Upload water district notices for device identification

### 2. Tester Portal (`/tester-portal/*`) 
For backflow testing companies:
- **API Access**: RESTful API for integration with external systems
- **CRM Dashboard**: Lead management and customer pipeline
- **Business Management**: All tools needed to run testing operations
- **Modular Add-ons**: Premium features available as paid upgrades
- **Company Signup**: Self-service registration for testing companies

### 3. Team Portal (`/team-portal/*`)
Internal business management (being migrated to Tester Portal add-ons):
- **Customer Management**: Full CRUD operations for customer data
- **Invoice Management**: Create, edit, and track invoices
- **Test Reports**: Generate and submit compliance reports
- **District Integration**: Automated submissions to water districts
- **Scheduling System**: Appointment and route management
- **Data Tools**: Import/export, backup, and analytics

## 🔧 Tech Stack

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with Supabase PostgreSQL
- **Authentication**: Supabase Auth + Custom JWT sessions
- **Payments**: Stripe integration with webhooks
- **Email**: Resend service with custom templates
- **Hosting**: Vercel with automatic deployments
- **Database**: Supabase with Row Level Security (RLS)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (20+ recommended)
- Supabase account and project
- Stripe account (test mode)
- Vercel account for deployment

### Local Development

1. **Clone and Install**
   ```bash
   git clone https://github.com/fisherbackflows/fisherbackflows-platform.git
   cd fisherbackflows-platform
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   # Configure your environment variables (see MANUAL_SETUP_REQUIRED.md)
   ```

3. **Database Setup**
   ```bash
   # Run the database migration (see DATABASE_MIGRATION_ORDER.md)
   # Execute the SQL files in your Supabase dashboard
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   # Open http://localhost:3010
   ```

## 📚 Documentation

- **[Setup Guide](MANUAL_SETUP_REQUIRED.md)** - Critical manual setup steps
- **[Database](DATABASE_MIGRATION_ORDER.md)** - Database schema and migrations  
- **[Security](SECURITY_AUDIT.md)** - Security configuration and RLS policies
- **[Development](CLAUDE.md)** - Full development guidelines and standards

## 🔐 Security Features

- Row Level Security (RLS) on all database tables
- JWT-based authentication with session management
- Stripe webhook signature verification
- Email verification for customer accounts
- Audit logging for all critical operations

## 🎯 Key Features

### For Customers
- ✅ Location-based company directory
- ✅ Online appointment scheduling  
- ✅ Secure payment processing
- ✅ Digital test report access
- ✅ Upload water district notices
- ✅ Email notifications and reminders

### For Testing Companies
- ✅ API access for system integration
- ✅ Customer relationship management
- ✅ Automated billing and invoicing
- ✅ Route optimization and scheduling
- ✅ Compliance report generation
- ✅ District submission automation

### For Platform Administration
- ✅ Multi-tenant company management
- ✅ Usage analytics and reporting
- ✅ Security monitoring and audit logs
- ✅ Backup and data management tools

## 🤝 Contributing

This is a private platform for Fisher Backflows. For development questions or issues, refer to the development documentation in `CLAUDE.md`.

## 📄 License

Proprietary - Fisher Backflows LLC. All rights reserved.

---

**Fisher Backflows Platform** - Streamlining backflow testing operations across Washington State.