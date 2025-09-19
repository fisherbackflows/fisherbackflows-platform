# Fisher Backflows Platform v3

A clean, customer-ready comprehensive backflow testing management platform serving customers, testing companies, and administrators.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (20+ recommended)
- Supabase account and project
- Stripe account
- Email service (Resend recommended)

### Local Development

1. **Clone and Setup**
   ```bash
   git clone [your-repository-url]
   cd fisherbackflows3
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Configure Environment**
   ```bash
   # Copy the example file
   cp .env.local.example .env.local

   # Edit with your actual values
   nano .env.local
   ```

3. **Start Development**
   ```bash
   npm run dev
   # Open http://localhost:3010
   ```

## 🏗️ Platform Architecture

### 1. Customer Portal (`/portal/*`)
For property owners who need backflow testing:
- **Company Directory**: Find certified testing companies by location
- **Account Management**: Registration, login, profile management
- **Device Management**: Track backflow prevention devices
- **Scheduling**: Book testing appointments online
- **Billing**: Secure online payments via Stripe
- **Reports**: Access test reports and compliance certificates

### 2. Team Portal (`/team-portal/*`)
For backflow testing companies:
- **CRM Dashboard**: Lead management and customer pipeline
- **Business Management**: All tools needed to run testing operations
- **Customer Management**: Full CRUD operations for customer data
- **Invoice Management**: Create, edit, and track invoices
- **Test Reports**: Generate and submit compliance reports
- **Scheduling System**: Appointment and route management

### 3. Field App (`/field/*`)
Mobile-optimized for technicians:
- **Offline Support**: Works without internet connection
- **GPS Tracking**: Real-time location tracking
- **Test Completion**: Mobile-friendly test forms
- **Route Management**: Optimized daily routes

### 4. Admin Panel (`/admin/*`)
For platform administration:
- **Analytics & Reporting**: Usage and performance metrics
- **Audit Logs**: Security and compliance monitoring
- **Health Monitoring**: System status and alerts
- **Data Management**: Backup and maintenance tools

## 🔧 Tech Stack

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with Supabase PostgreSQL
- **Authentication**: Supabase Auth + Custom JWT sessions
- **Payments**: Stripe integration with webhooks
- **Email**: Resend service with custom templates
- **PWA**: Service workers, offline support, push notifications
- **Database**: Supabase with Row Level Security (RLS)

## 🎯 Key Features

### For Customers
- ✅ Location-based company directory
- ✅ Online appointment scheduling
- ✅ Secure payment processing
- ✅ Digital test report access
- ✅ Email notifications and reminders
- ✅ Mobile-responsive design

### For Testing Companies
- ✅ Customer relationship management
- ✅ Automated billing and invoicing
- ✅ Route optimization and scheduling
- ✅ Compliance report generation
- ✅ Business analytics and insights

### Technical Features
- ✅ Progressive Web App (PWA)
- ✅ Offline functionality
- ✅ Push notifications
- ✅ Real-time updates
- ✅ Mobile-first design
- ✅ Type-safe with TypeScript

## 🔐 Security Features

- Row Level Security (RLS) on all database tables
- JWT-based authentication with session management
- Stripe webhook signature verification
- Email verification for customer accounts
- Audit logging for all critical operations
- Rate limiting and DDoS protection

## 📱 PWA Features

- **Installable**: Users can install as a native app
- **Offline Support**: Core functionality works offline
- **Push Notifications**: Real-time updates and reminders
- **Background Sync**: Data syncs when connection restored
- **App-like Experience**: Native mobile app feel

## 🛠️ Development

### Available Scripts
```bash
npm run dev           # Start development server
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Lint code
npm run type-check    # TypeScript validation
npm run test          # Run tests
npm run format        # Format code with Prettier
```

### Environment Configuration
Create `.env.local` with your actual configuration:
- Supabase project URL and keys
- Stripe API keys
- Email service configuration
- JWT secrets

### Database Setup
1. Create a new Supabase project
2. Run the database migrations
3. Configure Row Level Security policies
4. Set up authentication providers

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Other Platforms
- Netlify
- Railway
- AWS Amplify
- Self-hosted with Docker

## 📚 Documentation

- **[Development Guide](CLAUDE.md)** - Complete development documentation
- **Setup Script**: Run `./setup.sh` for automated setup
- **Environment**: Copy `.env.local.example` to `.env.local`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

Proprietary - Fisher Backflows LLC. All rights reserved.

---

**Fisher Backflows Platform v3** - A clean, customer-ready platform for backflow testing compliance.