-- Step 5: Update existing data to use Fisher Backflows company
-- Execute this fifth in Supabase SQL Editor

DO $$
DECLARE
    fisher_company_id UUID;
BEGIN
    -- Get the existing Fisher Backflows company
    SELECT id INTO fisher_company_id
    FROM companies
    WHERE slug = 'fisher-backflows'
    LIMIT 1;

    -- Update existing team_users to belong to Fisher Backflows company
    IF fisher_company_id IS NOT NULL THEN
        UPDATE team_users
        SET company_id = fisher_company_id
        WHERE company_id IS NULL;

        -- Update existing customers, devices, etc. to belong to Fisher Backflows
        UPDATE customers SET company_id = fisher_company_id WHERE company_id IS NULL;
        UPDATE devices SET company_id = fisher_company_id WHERE company_id IS NULL;
        UPDATE appointments SET company_id = fisher_company_id WHERE company_id IS NULL;
        UPDATE test_reports SET company_id = fisher_company_id WHERE company_id IS NULL;
        UPDATE invoices SET company_id = fisher_company_id WHERE company_id IS NULL;

        -- Create company settings if they don't exist
        INSERT INTO company_settings (company_id)
        VALUES (fisher_company_id)
        ON CONFLICT (company_id) DO NOTHING;

        RAISE NOTICE 'Updated existing data for Fisher Backflows company: %', fisher_company_id;
    ELSE
        RAISE NOTICE 'Fisher Backflows company not found - you may need to create it first';
    END IF;
END $$;