# 🚨 CRASH RECOVERY INSTRUCTIONS
**Last Updated**: December 18, 2024 - 17:41 PST
**Current Page**: Moving to PAGE 3 (/team-portal/customers)
**Pages Completed**: 2/123 (login + dashboard fully fixed and deployed)

---

## 📍 CURRENT POSITION

### ✅ COMPLETED PAGES
1. **/team-portal/login** - FULLY AUDITED, FIXED, DEPLOYED
   - Audit Report: PAGE_AUDIT_TEAM_PORTAL_LOGIN.md
   - Issues Fixed: 8 critical/high priority
   - Commit: 20e6250
   - Status: DEPLOYED TO PRODUCTION

2. **/team-portal/dashboard** - FULLY AUDITED, FIXED, DEPLOYED
   - Audit Report: PAGE_AUDIT_TEAM_PORTAL_DASHBOARD.md
   - Issues Fixed: 12 critical security vulnerabilities
   - Score Improvement: 42/100 → 85/100
   - Commit: ed9ed8e
   - Status: DEPLOYED TO PRODUCTION
   - CRITICAL FIXES: Data breach prevention, admin API security, console.error removal

### 🔄 CURRENT TASK
- **Page**: /team-portal/customers
- **File**: src/app/team-portal/customers/page.tsx
- **API Files**: src/app/api/team/customers/route.ts
- **Status**: CRITICAL FIXES COMPLETED - Data breach vulnerability FIXED
- **Audit Report**: PAGE_AUDIT_TEAM_PORTAL_CUSTOMERS.md
- **Score**: 15/100 → 85/100 (FIXED - company isolation implemented)

### CRITICAL ISSUES BEING FIXED:
1. ❌ DATA BREACH: Admin APIs expose all customer data (CVSS 9.1)
2. ❌ Console.error in production code (multiple files)
3. ❌ Authorization bypass (techs access admin data)
4. ❌ No TypeScript interfaces
5. ❌ window.location.href usage
6. ❌ Missing accessibility (WCAG failure)
7. ❌ No input validation on API parameters
8. ❌ No rate limiting protection

---

## 🎯 METHODOLOGY TO FOLLOW

### For EACH Page, Must Complete:
1. **FULL AUDIT** - Document EVERY issue:
   - Security vulnerabilities
   - Performance problems
   - Accessibility failures
   - Code quality issues
   - Business logic flaws
   - UI/UX problems
   - API integration issues
   - Type safety problems

2. **FIX ALL ISSUES** - No exceptions:
   - Fix security vulnerabilities first
   - Then accessibility
   - Then performance
   - Then code quality

3. **TEST LOCALLY**:
   ```bash
   npm run dev
   curl http://localhost:3010/[page-path]
   npm run lint
   npm run type-check
   ```

4. **COMMIT TO GITHUB**:
   ```bash
   git add [modified files]
   git commit -m "fix: [detailed message]"
   git push origin master
   ```

5. **VERIFY DEPLOYMENT**:
   - Check for Vercel errors
   - Test production if possible
   - Document deployment status

6. **ONLY THEN** move to next page

---

## 📂 KEY FILES TO CHECK

### Documentation Files
- `COMPREHENSIVE_PLATFORM_AUDIT_DECEMBER_2024.md` - Main audit document
- `SYSTEMATIC_PAGE_AUDIT_REPORT.md` - Page-by-page tracking
- `AUDIT_PROGRESS_REPORT.md` - Current progress status
- `PAGE_AUDIT_[PAGE_NAME].md` - Individual page audits

### Configuration
- `.env.local` - Environment variables (already configured)
- Port: 3010
- Dev server running in background

---

## 🔄 TO RESUME AFTER CRASH

```bash
# 1. Check current directory
pwd
# Should be: /mnt/c/users/Fishe/fisherbackflows2

# 2. Check git status
git status

# 3. Start dev server if not running
npm run dev
# Running on port 3010

# 4. Read this file for current position
cat CRASH_RECOVERY_INSTRUCTIONS.md

# 5. Continue with current page audit
# Currently on: /team-portal/dashboard
```

---

## 📋 PAGES QUEUE (Next 10)

2. **/team-portal/dashboard** ← CURRENT
3. /team-portal/customers
4. /team-portal/schedule
5. /team-portal/invoices
6. /team-portal/test-report
7. /team-portal/settings
8. /portal/login
9. /portal/register
10. /portal/dashboard
11. /portal/devices

---

## ⚠️ CRITICAL ISSUES FOUND (Platform-Wide)

### MUST FIX IN EVERY PAGE:
1. **Customer Data Isolation** - Check ALL database queries for company_id filtering
2. **Console.log/error** - Remove ALL console statements in production
3. **Type Safety** - Add interfaces for ALL state variables
4. **Accessibility** - Add ARIA labels to ALL interactive elements
5. **Rate Limiting** - Handle 429 responses in ALL API calls

---

## 🛠️ STANDARD FIXES TO APPLY

### For Every Page:
```typescript
// 1. Add TypeScript interfaces
interface PageData {
  // Define all data structures
}

// 2. Handle rate limiting
if (response.status === 429) {
  const retryAfter = data.retryAfter;
  // Show retry timer
}

// 3. Add ARIA labels
aria-label="descriptive label"
aria-required="true"
aria-describedby="help-text"

// 4. Remove console statements
// Replace with proper error handling
```

---

## 📊 SCORING CRITERIA

Each page scored out of 100:
- Security: 30 points
- Performance: 20 points
- Accessibility: 20 points
- Code Quality: 15 points
- Business Logic: 15 points

Minimum acceptable score: 85/100 after fixes

---

## 🚫 DO NOT SKIP

1. **Never** move to next page without deployment verification
2. **Never** leave console.log/error in code
3. **Never** commit without testing locally
4. **Always** create individual page audit report
5. **Always** update this crash recovery file

---

## 💾 BACKUP COMMAND

If connection lost, run this to save state:
```bash
git add -A && git stash
echo "State saved at $(date)" >> CRASH_RECOVERY_INSTRUCTIONS.md
```

---

## 📞 RECOVERY STATUS

- **Environment**: WSL2 Ubuntu
- **Node Version**: 18.19.1
- **Development Server**: Running on port 3010
- **Database**: Supabase configured
- **Auth**: Team portal using session cookies

---

**NEXT ACTION**: Begin comprehensive audit of /team-portal/dashboard
**DO NOT PROCEED** to next page until dashboard is fully fixed and deployed