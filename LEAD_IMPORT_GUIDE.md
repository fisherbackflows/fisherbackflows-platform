# Lead Import Guide

This guide documents the process for importing leads from CSV files into the Fisher Backflows platform.

## Recent Import Summary
- **Date**: September 7, 2025
- **File**: `new_decision_makers_puyallup.csv` 
- **Total Processed**: 120 leads
- **New Leads Added**: 49 leads
- **Duplicates Skipped**: 71 leads
- **Final Lead Count**: 273 total leads

## CSV Format Requirements

### Expected Columns:
```
Name,Title,Company,Address,Email,Phone,Source
```

### Example Row:
```
Lori Morrison,General Manager & Designated Broker,Vista Property Management,"1002 39th Ave SW Ste 302, Puyallup, WA 98373",lori@govista.net,253-881-3034,"Vista Property Management staff page shows..."
```

## Database Schema Mapping

### Lead Fields in Database:
- `first_name` - Extracted from Name field (first word)
- `last_name` - Extracted from Name field (remaining words)
- `company_name` - From Company column
- `email` - From Email column
- `phone` - From Phone column
- `address_line1` - Street address extracted from Address
- `city` - Extracted from Address (defaults to "Puyallup")
- `state` - Extracted from Address (defaults to "WA")
- `zip_code` - Extracted from Address
- `source` - Set to custom source identifier
- `status` - Set to "new" for all imports
- `estimated_value` - Auto-calculated based on title
- `notes` - Includes title and source information
- `assigned_to` - Set to null
- `created_at` - Import timestamp
- `updated_at` - Import timestamp

## Value Estimation Rules
- **Managers & Brokers**: $1,500
- **Coordinators & Accounting**: $750  
- **General Contacts**: $500

## Import Process Steps

1. **Install Dependencies**:
   ```bash
   npm install csv-parser
   ```

2. **Create Import Script** with proper CSV parsing:
   ```javascript
   fs.createReadStream(csvPath)
     .pipe(csv({
       headers: ['Name', 'Title', 'Company', 'Address', 'Email', 'Phone', 'Source'],
       skipEmptyLines: true
     }))
   ```

3. **Duplicate Prevention**:
   - Check existing leads by email
   - Skip leads that already exist
   - Only import truly new leads

4. **Batch Processing**:
   - Process in batches of 50 leads
   - Handle errors gracefully
   - Provide progress feedback

## Key Technical Notes

- **No Title Column**: Database doesn't have `title` field - store in `notes`
- **Assigned To**: Must be `null`, not "Unassigned" string
- **Address Parsing**: Regex pattern for "Street, City, ST ZIP"
- **Duplicate Detection**: Uses email as unique identifier

## Future Import Instructions

1. Place CSV file in `/mnt/c/Users/Fishe/fisherbackflows2/Leads/`
2. Update csvPath in import script
3. Adjust source identifier as needed
4. Run: `node import-script.js`
5. Clean up temporary files after import
6. Commit and deploy changes

## Backup & Recovery
- All leads stored in Supabase PostgreSQL
- Git repository: https://github.com/fisherbackflows/fisherbackflows-platform
- Production site: https://www.fisherbackflows.com
- Vercel auto-deploys from main branch

## Verification Steps
1. Check API: `/api/business-admin/leads` for total count
2. Login to business admin portal
3. Verify leads appear in management interface
4. Test filtering and search functionality

---
*Generated with Claude Code - September 2025*