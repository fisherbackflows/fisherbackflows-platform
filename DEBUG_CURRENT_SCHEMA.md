# Debug Current Database Schema

## 🔍 Check What Happened with First Migration

Run these queries in Supabase SQL editor to see the current state:

### 1. Check if organizations table exists:
```sql
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations'
);
```
**Expected:** Should return `true` if first migration worked

### 2. List all current tables:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```
**Expected:** Should show organizations, customers, devices, etc. if first migration worked

### 3. Check if organizations table has data:
```sql
SELECT * FROM organizations;
```
**Expected:** Should show Fisher Backflows organization if first migration worked

### 4. Check specific column exists:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'customers' 
AND column_name = 'organization_id';
```
**Expected:** Should return `organization_id` if first migration worked

## 🚨 Possible Issues

### Issue 1: First Migration Failed Silently
If organizations table doesn't exist, the first migration failed. Common causes:
- SQL syntax error in the file
- Extension creation failed
- Transaction was rolled back

### Issue 2: First Migration Was Partial  
If some tables exist but not others, the migration was interrupted.

### Issue 3: Column Name is Wrong
If tables exist but column is named differently (like `company_id`).

## 🔧 Troubleshooting Steps

### If organizations table is missing:
1. **Re-run the first migration** - Copy the entire contents again
2. **Check for errors** - Look at the bottom of SQL editor for error messages
3. **Run in smaller chunks** - Execute sections separately to find the issue

### If you see any errors in the first migration:
Take a screenshot and we'll create a simpler, more targeted fix.

### Emergency Simple Schema
If all else fails, here's a minimal schema that should work:

```sql
-- Minimal working schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO organizations (id, name) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Fisher Backflows')
ON CONFLICT (id) DO NOTHING;

-- Test it worked
SELECT * FROM organizations;
```

Run the debug queries above and let me know what you see!