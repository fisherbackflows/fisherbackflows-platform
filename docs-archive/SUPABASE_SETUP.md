# 🚀 Supabase Setup Guide for Fisher Backflows Platform

## Quick Setup Instructions

### 1. Create Your Supabase Project

Based on your Supabase project creation form, here are the recommended settings:

```
Organization: Select your organization
Project name: fisher-backflows-platform
Database Password: [Generate a secure password - SAVE THIS!]
Region: US West (Oregon) - or closest to your users
Data API Configuration: Enabled (default)
Postgres Type: Small (can be upgraded later)
```

### 2. Get Your Project Credentials

After your project is created:

1. Go to **Settings** → **API**
2. Copy these values:
   - `Project URL` → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   - `service_role` key → This is your `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` with your actual Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### 4. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase/schema.sql` 
3. Click **Run** to create all tables and functions

### 5. Configure Authentication

1. Go to **Authentication** → **Settings**
2. Enable **Email** provider
3. Set **Site URL** to: `http://localhost:3010` (for development)
4. Add **Redirect URLs**:
   - `http://localhost:3010/portal/dashboard`
   - `http://localhost:3010/auth/callback`

### 6. Set Up Row Level Security (RLS)

The schema includes RLS policies, but verify them in:
**Authentication** → **Policies**

Key policies included:
- Customers can only access their own data
- Team members have full access with proper role
- Public access for registration

### 7. Test the Connection

Restart your development server:
```bash
npm run dev
```

Visit `http://localhost:3010/portal/register` to test customer registration.

## 🔧 Advanced Configuration

### Database Triggers and Functions

Your schema includes automated triggers for:
- Automatic account number generation
- Timestamp updates
- Balance calculations
- Test scheduling

### Real-time Subscriptions

Enable real-time for live updates:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE test_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
```

### Email Templates

Configure email templates in **Authentication** → **Email Templates**:
- Welcome email for new customers
- Test reminder notifications
- Password reset emails

## 📱 Mobile App Support

The platform is configured for mobile-first design with:
- Offline capability
- Progressive Web App (PWA) features  
- Touch-optimized interfaces

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - it's in `.gitignore`
2. **Rotate keys regularly** in production
3. **Use service role key only on server**
4. **Enable MFA** for your Supabase account
5. **Monitor database activity** in dashboard

## 🚨 Troubleshooting

### Common Issues:

**"Supabase is not configured" error:**
- Check `.env.local` file exists
- Verify all environment variables are set
- Restart development server

**Database connection failed:**
- Verify project URL is correct
- Check if database is active (not paused)
- Confirm network access

**Authentication not working:**
- Check redirect URLs in Supabase settings
- Verify email provider is enabled
- Check browser console for errors

## 📊 Production Deployment

For production deployment:
1. Upgrade to **Pro plan** for higher limits
2. Configure **custom domain** 
3. Set up **database backups**
4. Enable **point-in-time recovery**
5. Configure **monitoring alerts**

## 🎯 Next Steps

After setup is complete:
1. Test customer registration flow
2. Create test data for development
3. Configure automated backups
4. Set up monitoring dashboards
5. Deploy to staging environment

---

**Need Help?** 
- 📚 [Supabase Documentation](https://supabase.com/docs)
- 💬 [Supabase Discord](https://discord.supabase.com/)
- 🐛 [Report Issues](https://github.com/supabase/supabase/issues)

Your Fisher Backflows platform is ready for world-class data management! 🚀