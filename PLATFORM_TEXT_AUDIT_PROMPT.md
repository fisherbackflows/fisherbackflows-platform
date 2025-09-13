# Platform Text Consistency Audit - Complete Remediation Prompt

## Task Overview
Complete the platform text consistency audit by methodically addressing ALL remaining inconsistencies found in code comments, documentation, and internal references that still use outdated "team portal" terminology instead of the current "Tester Portal" branding.

## Current Status Assessment
- ✅ User-facing text: Mostly consistent with "Tester Portal"
- ✅ Placeholder text: Updated successfully  
- ❌ Code comments: Multiple "team portal" references remain
- ❌ Internal documentation: Inconsistent terminology
- ❌ API route comments: Using old "team portal" references

## Systematic Remediation Steps

### Step 1: Identify All Remaining Issues
```bash
# Find all "team portal" references in comments and documentation
grep -r -i "team portal" /data/data/com.termux/files/home/fisherbackflows/src/ | grep -v "team-portal" > /tmp/team_portal_refs.txt

# Find code comments specifically (lines starting with // or /* or within /** */)
grep -r "// .*[Tt]eam [Pp]ortal\|/\* .*[Tt]eam [Pp]ortal\|description.*[Tt]eam [Pp]ortal" /data/data/com.termux/files/home/fisherbackflows/src/

# Check for inconsistent capitalization
grep -r -i "[Tt]eam [Pp]ortal" /data/data/com.termux/files/home/fisherbackflows/src/ | grep -v "team-portal"
```

### Step 2: Categorize and Prioritize
1. **High Priority**: User-visible strings and error messages
2. **Medium Priority**: Code comments and documentation
3. **Low Priority**: Internal variable names and non-user-facing references

### Step 3: Methodical File-by-File Updates
For each file identified:
1. **Read the full file context** to understand the change impact
2. **Identify the specific terminology decision**:
   - "Team Portal" → "Tester Portal" (for user-facing)
   - "team portal" → "tester portal" (for comments/docs)
   - "team-portal" → keep as-is (URL paths should remain)
3. **Make precise replacements** using Edit tool
4. **Verify the change makes sense** in context

### Step 4: Verification and Documentation
1. Run final comprehensive search to confirm no issues remain
2. Update this audit document with exact changes made
3. Create summary of all terminology decisions for future consistency

## Expected Files to Update (Based on Audit)
- `/src/app/api/team/appointments/route.ts` - Comment updates
- `/src/app/api/team/customers/route.ts` - Comment updates  
- `/src/app/maintenance/page.tsx` - Comment updates
- `/src/app/signup/page.tsx` - Comment updates
- `/src/lib/site-structure.ts` - Description updates
- `/src/components/ui/UnifiedTheme.tsx` - Comment updates

## Success Criteria
- Zero remaining "team portal" references in user-facing text
- Consistent "Tester Portal" branding in all comments and documentation
- URL paths remain unchanged (team-portal/* routes are correct)
- All changes maintain code functionality and readability

## Quality Control
- Use grep searches to verify each category of fix
- Read changed files in full to ensure context makes sense
- Test that no functionality is broken by text changes
- Document any edge cases or decisions made during the process

Execute this audit systematically, file by file, with verification at each step.