-- Fisher Backflows Sample Data
-- Run this in Supabase SQL Editor after creating the schema

-- Clear existing data (optional)
-- DELETE FROM water_department_submissions;
-- DELETE FROM scheduled_reminders;
-- DELETE FROM email_logs;
-- DELETE FROM payments;
-- DELETE FROM invoices;
-- DELETE FROM test_reports;
-- DELETE FROM appointments;
-- DELETE FROM devices;
-- DELETE FROM customers;

-- Sample Customers
INSERT INTO customers (account_number, name, email, phone, address, balance, next_test_date, status) VALUES 
('FB001', 'John Smith', 'john.smith@email.com', '(253) 555-0123', '123 Main St, Tacoma, WA 98401', 0.00, '2025-12-15', 'Active'),
('FB002', 'Sarah Johnson', 'sarah.j@gmail.com', '(253) 555-0124', '456 Oak Ave, Lakewood, WA 98498', 150.00, '2025-11-20', 'Active'),
('FB003', 'Mike Chen', 'mike.chen@business.com', '(253) 555-0125', '789 Pine St, Puyallup, WA 98371', 0.00, '2025-10-10', 'Active'),
('FB004', 'Lisa Williams', 'lwilliams@email.com', '(253) 555-0126', '321 Cedar Ln, Federal Way, WA 98003', 75.00, '2024-12-01', 'Needs Service'),
('FB005', 'Tech Demo User', 'demo@fisherbackflows.com', '(253) 278-8692', '555 Demo St, Tacoma, WA 98401', 0.00, '2025-06-01', 'Active');

-- Sample Devices
INSERT INTO devices (customer_id, location, serial_number, size, make, model, install_date, last_test_date, next_test_date, status) VALUES 
((SELECT id FROM customers WHERE account_number = 'FB001'), '123 Main St - Backyard', 'BF-2024-001', '3/4"', 'Watts', 'Series 909', '2023-01-15', '2024-01-15', '2025-01-15', 'Passed'),
((SELECT id FROM customers WHERE account_number = 'FB002'), '456 Oak Ave - Side Yard', 'BF-2024-002', '1"', 'Febco', 'Series 860', '2022-11-20', '2023-11-20', '2024-11-20', 'Passed'),
((SELECT id FROM customers WHERE account_number = 'FB003'), '789 Pine St - Front Yard', 'BF-2024-003', '3/4"', 'Zurn Wilkins', '350XL', '2023-10-10', '2024-10-10', '2025-10-10', 'Passed'),
((SELECT id FROM customers WHERE account_number = 'FB004'), '321 Cedar Ln - Basement', 'BF-2023-004', '1 1/2"', 'Watts', 'Series 909', '2022-12-01', '2023-12-01', '2024-12-01', 'Failed'),
((SELECT id FROM customers WHERE account_number = 'FB005'), '555 Demo St - Back Patio', 'BF-DEMO-001', '3/4"', 'Watts', 'Series 909', '2024-06-01', '2024-12-01', '2025-12-01', 'Passed');

-- Sample Appointments (mix of past, current, and future)
INSERT INTO appointments (customer_id, service_type, appointment_date, appointment_time, duration, status, device_location, notes, technician, device_id) VALUES 
-- Completed appointments
((SELECT id FROM customers WHERE account_number = 'FB001'), 'Annual Test', '2024-01-15', '10:00', 60, 'Completed', '123 Main St - Backyard', 'Regular annual test', 'Mike Fisher', (SELECT id FROM devices WHERE serial_number = 'BF-2024-001')),
((SELECT id FROM customers WHERE account_number = 'FB002'), 'Annual Test', '2023-11-20', '14:00', 45, 'Completed', '456 Oak Ave - Side Yard', 'Easy access', 'Mike Fisher', (SELECT id FROM devices WHERE serial_number = 'BF-2024-002')),

-- Scheduled appointments (for testing field app)
((SELECT id FROM customers WHERE account_number = 'FB003'), 'Annual Test', '2025-01-20', '09:00', 60, 'Scheduled', '789 Pine St - Front Yard', 'Customer prefers morning appointments', 'Mike Fisher', (SELECT id FROM devices WHERE serial_number = 'BF-2024-003')),
((SELECT id FROM customers WHERE account_number = 'FB004'), 'Repair & Retest', '2025-01-22', '13:00', 90, 'Scheduled', '321 Cedar Ln - Basement', 'Failed previous test - needs repair first', 'Mike Fisher', (SELECT id FROM devices WHERE serial_number = 'BF-2023-004')),
((SELECT id FROM customers WHERE account_number = 'FB005'), 'Annual Test', '2025-01-25', '11:00', 60, 'Scheduled', '555 Demo St - Back Patio', 'Demo appointment for testing', 'Mike Fisher', (SELECT id FROM devices WHERE serial_number = 'BF-DEMO-001'));

-- Sample Test Reports (for completed appointments)
INSERT INTO test_reports (customer_id, device_id, test_date, test_type, initial_pressure, final_pressure, test_duration, status, technician, notes, water_district, submitted, submitted_date) VALUES 
((SELECT id FROM customers WHERE account_number = 'FB001'), (SELECT id FROM devices WHERE serial_number = 'BF-2024-001'), '2024-01-15', 'Annual Test', 15.0, 14.8, 15, 'Passed', 'Mike Fisher', 'Device tested perfectly, no issues found', 'City of Tacoma', true, '2024-01-15'),
((SELECT id FROM customers WHERE account_number = 'FB002'), (SELECT id FROM devices WHERE serial_number = 'BF-2024-002'), '2023-11-20', 'Annual Test', 16.2, 15.9, 12, 'Passed', 'Mike Fisher', 'Good condition, minimal pressure drop', 'Lakewood Water District', true, '2023-11-20');

-- Sample Invoices
INSERT INTO invoices (customer_id, invoice_number, service_type, device_size, amount, status, due_date, notes) VALUES 
((SELECT id FROM customers WHERE account_number = 'FB001'), 'INV-2024-001', 'Annual Test', '3/4"', 150.00, 'Paid', '2024-02-14', 'Annual backflow test - passed'),
((SELECT id FROM customers WHERE account_number = 'FB002'), 'INV-2023-002', 'Annual Test', '1"', 175.00, 'Paid', '2023-12-20', 'Annual backflow test - passed'),
((SELECT id FROM customers WHERE account_number = 'FB004'), 'INV-2024-003', 'Annual Test', '1 1/2"', 200.00, 'Overdue', '2024-01-30', 'Failed test - repair required'),
((SELECT id FROM customers WHERE account_number = 'FB005'), 'INV-2024-004', 'Annual Test', '3/4"', 150.00, 'Pending', '2025-01-25', 'Demo invoice for testing');

-- Sample Payments
INSERT INTO payments (invoice_id, customer_id, amount, status, payment_method, payment_link, created_at, processed_at) VALUES 
((SELECT id FROM invoices WHERE invoice_number = 'INV-2024-001'), (SELECT id FROM customers WHERE account_number = 'FB001'), 150.00, 'completed', 'stripe', 'https://checkout.stripe.com/pay/example1', '2024-01-16 10:00:00+00', '2024-01-16 10:05:00+00'),
((SELECT id FROM invoices WHERE invoice_number = 'INV-2023-002'), (SELECT id FROM customers WHERE account_number = 'FB002'), 175.00, 'completed', 'stripe', 'https://checkout.stripe.com/pay/example2', '2023-11-21 14:30:00+00', '2023-11-21 14:32:00+00');

-- Sample Scheduled Reminders
INSERT INTO scheduled_reminders (customer_id, reminder_type, scheduled_date, status, message) VALUES 
((SELECT id FROM customers WHERE account_number = 'FB001'), 'annual_test_due', '2024-12-15', 'scheduled', 'Your annual backflow test is due on 2025-01-15. Schedule now to stay compliant.'),
((SELECT id FROM customers WHERE account_number = 'FB003'), 'appointment_reminder', '2025-01-19', 'scheduled', 'Reminder: Your backflow test is tomorrow at 9:00 AM'),
((SELECT id FROM customers WHERE account_number = 'FB004'), 'appointment_reminder', '2025-01-21', 'scheduled', 'Reminder: Your repair and retest is tomorrow at 1:00 PM'),
((SELECT id FROM customers WHERE account_number = 'FB005'), 'annual_test_due', '2025-05-01', 'scheduled', 'Your annual backflow test is due on 2025-06-01. Schedule now to stay compliant.');

-- Sample Water Department Submissions
INSERT INTO water_department_submissions (test_report_id, water_district, submission_method, confirmation_number, status, submitted_at) VALUES 
((SELECT id FROM test_reports WHERE customer_id = (SELECT id FROM customers WHERE account_number = 'FB001')), 'City of Tacoma', 'Email', 'TACOMA-2024-001', 'success', '2024-01-15 16:00:00+00'),
((SELECT id FROM test_reports WHERE customer_id = (SELECT id FROM customers WHERE account_number = 'FB002')), 'Lakewood Water District', 'Email', 'LAKEWOOD-2023-002', 'success', '2023-11-20 17:30:00+00');

-- Sample Email Logs (for tracking automation)
INSERT INTO email_logs (recipient_email, subject, email_type, status, sent_at, message_id) VALUES 
('john.smith@email.com', 'Backflow Test Complete - 123 Main St - Passed', 'test_completion', 'sent', '2024-01-15 15:30:00+00', 'msg_2024_001'),
('sarah.j@gmail.com', 'Backflow Test Complete - 456 Oak Ave - Passed', 'test_completion', 'sent', '2023-11-20 16:00:00+00', 'msg_2023_002'),
('demo@fisherbackflows.com', 'Appointment Confirmed - 2025-01-25 at 11:00', 'appointment_confirmation', 'sent', '2024-12-01 09:00:00+00', 'msg_demo_001');

-- Update customer balances based on unpaid invoices
UPDATE customers SET balance = (
  SELECT COALESCE(SUM(amount), 0) 
  FROM invoices 
  WHERE invoices.customer_id = customers.id 
  AND status IN ('Pending', 'Overdue')
);

-- Summary of sample data
SELECT 
  'Sample Data Created:' as summary,
  (SELECT COUNT(*) FROM customers) as customers,
  (SELECT COUNT(*) FROM devices) as devices,
  (SELECT COUNT(*) FROM appointments) as appointments,
  (SELECT COUNT(*) FROM test_reports) as test_reports,
  (SELECT COUNT(*) FROM invoices) as invoices,
  (SELECT COUNT(*) FROM payments) as payments;