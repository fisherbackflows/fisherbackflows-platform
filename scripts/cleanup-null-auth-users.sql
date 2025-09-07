-- Cleanup script for customers with null auth_user_ids
-- These are likely test accounts that should be removed or fixed

-- First, let's see what we have
SELECT 
    id,
    email,
    first_name,
    last_name,
    account_number,
    account_status,
    created_at,
    auth_user_id
FROM customers 
WHERE auth_user_id IS NULL
ORDER BY created_at DESC;

-- Check if these customers have any associated data that would prevent deletion
-- (uncomment to run these checks)

/*
-- Check for devices
SELECT c.email, COUNT(d.id) as device_count
FROM customers c
LEFT JOIN devices d ON d.customer_id = c.id
WHERE c.auth_user_id IS NULL
GROUP BY c.id, c.email;

-- Check for appointments
SELECT c.email, COUNT(a.id) as appointment_count
FROM customers c
LEFT JOIN appointments a ON a.customer_id = c.id
WHERE c.auth_user_id IS NULL
GROUP BY c.id, c.email;

-- Check for test reports
SELECT c.email, COUNT(tr.id) as report_count
FROM customers c
LEFT JOIN test_reports tr ON tr.customer_id = c.id
WHERE c.auth_user_id IS NULL
GROUP BY c.id, c.email;

-- Check for invoices
SELECT c.email, COUNT(i.id) as invoice_count
FROM customers c
LEFT JOIN invoices i ON i.customer_id = c.id
WHERE c.auth_user_id IS NULL
GROUP BY c.id, c.email;
*/

-- CAUTION: Only run the DELETE after verifying the above checks
-- Delete customers with null auth_user_id that have no associated data
-- Uncomment when ready to execute:

/*
DELETE FROM customers 
WHERE auth_user_id IS NULL 
AND id NOT IN (
    -- Exclude customers with devices
    SELECT DISTINCT customer_id FROM devices WHERE customer_id IS NOT NULL
    UNION
    -- Exclude customers with appointments  
    SELECT DISTINCT customer_id FROM appointments WHERE customer_id IS NOT NULL
    UNION
    -- Exclude customers with test reports
    SELECT DISTINCT customer_id FROM test_reports WHERE customer_id IS NOT NULL
    UNION
    -- Exclude customers with invoices
    SELECT DISTINCT customer_id FROM invoices WHERE customer_id IS NOT NULL
);
*/