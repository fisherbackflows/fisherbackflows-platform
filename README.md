# Fisher Backflows - Business Management System

A comprehensive backflow testing business management system with customer portal, built with Next.js 15, TypeScript, Supabase, and deployed on Vercel.

## Features

### Business Management
- **Customer Database** - Complete customer management with device tracking
- **Test Reports** - Digital test report generation with PDF export
- **Scheduling System** - Appointment booking and calendar management
- **Invoice Management** - Automated billing and payment tracking
- **Water District Automation** - Automated report submission to districts
- **Annual Reminders** - Automated customer notifications

### Customer Portal
- **Account Access** - Email/phone authentication
- **Bill Payment** - Secure online payment processing
- **Service Scheduling** - Online appointment booking
- **Test History** - View past test results and reports
- **Account Overview** - Balance, devices, and service status

### Technical Features
- **Progressive Web App** - Installable mobile app experience
- **Offline Support** - Works without internet connection
- **Real-time Data** - Live updates across all devices
- **Mobile-First Design** - Optimized for mobile and tablet
- **Secure Authentication** - Row-level security with Supabase

## Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **Icons**: Lucide React
- **PDF Generation**: jsPDF

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/fisherbackflows.git
   cd fisherbackflows
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase/schema.sql` in the SQL editor
   - Copy your project URL and anon key

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## Database Schema

The system uses the following main tables:
- `customers` - Customer information and accounts
- `devices` - Backflow prevention devices
- `test_reports` - Test results and reports
- `invoices` - Billing and payment records
- `appointments` - Scheduled services

## API Routes

- `/api/customers` - Customer CRUD operations
- `/api/test-reports` - Test report management
- `/api/invoices` - Invoice and billing
- `/api/appointments` - Appointment scheduling
- `/api/auth/portal` - Customer portal authentication

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m \"Initial commit\"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository at [vercel.com](https://vercel.com)
   - Add environment variables in Vercel dashboard
   - Deploy automatically on every push

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## Usage

### Business Dashboard
- Access at `/app` for business management
- Manage customers, devices, and appointments
- Generate and send test reports
- Create invoices and track payments

### Customer Portal
- Access at `/portal` for customer self-service
- Login with email or phone number
- Pay bills, schedule service, view history
- Demo mode: use \"demo\" as login

### Test Reports
- Digital forms with automatic calculations
- PDF export and email delivery
- Water district submission automation
- Save drafts and completed reports

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact [admin@fisherbackflows.com](mailto:admin@fisherbackflows.com)