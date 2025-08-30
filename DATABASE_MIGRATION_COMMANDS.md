# Database Migration Commands

## 🎯 Priority #1: Apply Missing Database Migrations

**Impact:** This will eliminate ~400+ TypeScript errors and enable full platform functionality.

### Commands to Run (Desktop Only):

```bash
# Connect to Supabase with write access
export SUPABASE_ACCESS_TOKEN=sbp_bc8d8e30325000a099ffb06310f3e53d87d37c21
export SUPABASE_PROJECT_REF=jvhbqfueutvfepsjmztx

# Option 1: Using Supabase CLI (Recommended)
supabase db reset --linked
supabase db push

# Option 2: Direct SQL execution
psql postgresql://[connection-string] < supabase/migrations/003_missing_business_tables.sql
psql postgresql://[connection-string] < supabase/migrations/004_complete_business_schema.sql
```

### What These Migrations Create:

✅ **customers** - Complete customer management  
✅ **devices** - Backflow prevention device tracking  
✅ **appointments** - Scheduling and technician assignment  
✅ **test_reports** - Detailed test results and compliance  
✅ **invoices** - Billing and payment tracking  
✅ **payments** - Payment processing and history  
✅ **leads** - Lead generation and conversion  
✅ **water_department_submissions** - Regulatory compliance  

### Expected Result:
- TypeScript errors: **471 → ~50** (90% reduction)
- All business logic fully functional
- Complete type safety restored

### Verification Commands:
```bash
# Check table creation
npm run type-check  # Should see dramatic error reduction
supabase db diff    # Verify schema matches

# Test database connectivity
curl http://localhost:3000/api/admin/activity  # Should work without "never" types
```

---

**Next Priority:** Authentication System (which I can work on now)