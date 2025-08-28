# Fisher Backflows Platform

Minimalist, automated backflow testing platform with customer and team portals.

## Quick Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables** - Create `.env.local`:
   ```env
   # Supabase (required)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   
   # Email (SendGrid)
   SENDGRID_API_KEY=your_sendgrid_key
   SENDGRID_FROM_EMAIL=noreply@fisherbackflows.com
   
   # Payments (Stripe)
   STRIPE_SECRET_KEY=your_stripe_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
   ```

3. **Database setup**
   ```bash
   npx supabase db push
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

## Core Features

### Customer Portal (`/portal`)
- Device management & test scheduling
- Report viewing & payment processing
- Account management

### Team Portal (`/team-portal`)
- Schedule management & test completion
- Report generation & customer management
- Analytics dashboard

### Automation Engine
- Email notifications
- Payment processing
- Schedule optimization
- Report distribution

## Tech Stack
- **Next.js 15** - React framework
- **Supabase** - Auth & database
- **Stripe** - Payment processing
- **SendGrid** - Email delivery
- **Tailwind CSS** - Styling

## Deployment
Deploy to Vercel with one click:
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/fisherbackflows/platform)

## Support
For issues or questions, contact support@fisherbackflows.com