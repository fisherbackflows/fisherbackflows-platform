-- Import leads from CSV data into the leads table
-- Run this in your Supabase SQL editor

INSERT INTO leads (
  first_name, 
  last_name, 
  company_name, 
  email, 
  phone, 
  address_line1, 
  city, 
  state, 
  source, 
  status, 
  notes, 
  assigned_to,
  created_at,
  updated_at
) VALUES
('Lori', 'Morrison', 'Vista Property Management', 'lori@govista.net', '253-881-3034', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: General Manager & Designated Broker. Imported from CSV', NULL, NOW(), NOW()),

('Julia', 'Radcliffe', 'Vista Property Management', 'julia@govista.net', '253-881-1206', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: Senior Property Manager. Imported from CSV', NULL, NOW(), NOW()),

('Lisa', 'McKenzie', 'Vista Property Management', 'lisa@govista.net', '253-881-3054', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: Property Manager. Imported from CSV', NULL, NOW(), NOW()),

('Sarah', 'Pignotti', 'Vista Property Management', 'sarah@govista.net', '253-881-3059', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: Accounting. Imported from CSV', NULL, NOW(), NOW()),

('Rita', 'Jefferson', 'Vista Property Management', 'rita@govista.net', '253-881-3051', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: Property Manager. Imported from CSV', NULL, NOW(), NOW()),

('Kim', 'Tarr', 'Vista Property Management', 'kim@govista.net', '253-881-3045', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: Maintenance Coordinator. Imported from CSV', NULL, NOW(), NOW()),

('Lynnette', 'Rohr', 'Vista Property Management', 'lynnette@govista.net', '253-881-3044', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: Accounting. Imported from CSV', NULL, NOW(), NOW()),

('Olivia', 'Lopez', 'Vista Property Management', 'olivia@govista.net', '253-881-3064', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: Property Manager. Imported from CSV', NULL, NOW(), NOW()),

('Bud', 'Ribitsch', 'Vista Property Management', 'bud@govista.net', '', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: Maintenance Technician. Imported from CSV', NULL, NOW(), NOW()),

('Merritt', 'Riley', 'Vista Property Management', 'mriley@govista.net', '253-881-3054', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: Owner. Imported from CSV', NULL, NOW(), NOW()),

('Stevelle', 'Resutek', 'Integrity Property Management', 'stevelle@integrityrentals.com', '253-466-3588 ext 7', '10309 Canyon Rd E, Puyallup, WA 98373', 'Puyallup', 'WA', 'Integrity Property Management research', 'new', 'Title: Designated Broker-Owner. Imported from CSV', NULL, NOW(), NOW()),

('Catherine', 'Allen', 'Integrity Property Management', 'cathy@integrityrentals.com', '253-466-3588 ext 2', '10309 Canyon Rd E, Puyallup, WA 98373', 'Puyallup', 'WA', 'Integrity Property Management research', 'new', 'Title: Bookkeeper. Imported from CSV', NULL, NOW(), NOW()),

('Sandy', 'Boldenow', 'Integrity Property Management', 'sandy@integrityre.net', '253-466-3588 ext 5', '10309 Canyon Rd E, Puyallup, WA 98373', 'Puyallup', 'WA', 'Integrity Property Management research', 'new', 'Title: Broker/Property Manager. Imported from CSV', NULL, NOW(), NOW()),

('Kiley', 'Narlock', 'Integrity Property Management', 'kiley@integrityrentals.com', '253-466-3588 ext 4', '10309 Canyon Rd E, Puyallup, WA 98373', 'Puyallup', 'WA', 'Integrity Property Management research', 'new', 'Title: Broker/Property Manager. Imported from CSV', NULL, NOW(), NOW()),

('Cheryl', 'Kehoe', 'Integrity Property Management', 'clkehoe@hotmail.com', '253-466-3588', '10309 Canyon Rd E, Puyallup, WA 98373', 'Puyallup', 'WA', 'Integrity Property Management research', 'new', 'Title: Broker - Sales. Imported from CSV', NULL, NOW(), NOW()),

('Phillip', 'Anderson', 'Puyallup School District', '', '253-841-8777', '323 12th St NW, Puyallup, WA 98371', 'Puyallup', 'WA', 'Puyallup School District research', 'new', 'Title: Director of Maintenance. Imported from CSV', NULL, NOW(), NOW()),

('Lara', 'Pharmer', 'MK Property Services', 'lara@mkps.net', '425-888-2993', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Sr. Property Manager/Broker. Imported from CSV', NULL, NOW(), NOW()),

('Gina', 'Roberts', 'MK Property Services', 'gina@mkps.net', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Sr. Property Administrator. Imported from CSV', NULL, NOW(), NOW()),

('Marielle', 'De La Torre', 'MK Property Services', 'marielle@mkps.net', '425-818-4159', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: COO/Broker. Imported from CSV', NULL, NOW(), NOW()),

('Radric', 'Marapao', 'MK Property Services', 'radric@mkps.net', '425-818-4154', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Broker/Executive Assistant. Imported from CSV', NULL, NOW(), NOW()),

('Marcey', 'Nuccitelli', 'MK Property Services', 'marcey.nuccitelli@gmail.com', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Property Manager/Broker. Imported from CSV', NULL, NOW(), NOW()),

('Marvie', 'Kirkland', 'MK Property Services', 'marvie@mkps.net', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Controller. Imported from CSV', NULL, NOW(), NOW()),

('Mike', 'Kirkland', 'MK Property Services', 'mike@mkps.net', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Owner/Designated Broker. Imported from CSV', NULL, NOW(), NOW()),

('Stephen', 'Heffington', 'MK Property Services', 'stephen@mkps.net', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Accounting Specialist. Imported from CSV', NULL, NOW(), NOW()),

('Sydena', 'Severe', 'MK Property Services', 'syd@mkps.net', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Chief Business Development Officer. Imported from CSV', NULL, NOW(), NOW()),

('Trish', 'Gallagher', 'MK Property Services', 'trish@mkps.net', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Property Manager/Broker. Imported from CSV', NULL, NOW(), NOW()),

('Valerie', 'Dimick', 'MK Property Services', 'valerie@mkps.net', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Senior Accounting Specialist. Imported from CSV', NULL, NOW(), NOW()),

('Dawn', 'Hardley', 'MK Property Services', 'dawn@mkps.net', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Property Manager/Broker. Imported from CSV', NULL, NOW(), NOW()),

('Kristie', 'Herman', 'MK Property Services', 'kristie@mkps.net', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Accounting Specialist. Imported from CSV', NULL, NOW(), NOW()),

('Heidi', 'Ashlock', 'Puyallup School District', 'ashlocHM@puyallupsd.org', '253-841-8758', '302 2nd St SE, Puyallup, WA 98372', 'Puyallup', 'WA', 'Puyallup School District research', 'new', 'Title: Facility Use Manager. Imported from CSV', NULL, NOW(), NOW()),

('Deon', 'Moyd', 'City of Puyallup Parks & Recreation', 'deon@puyallupwa.gov', '253-841-4321', '808 Valley Ave NW, Puyallup, WA 98371', 'Puyallup', 'WA', 'City of Puyallup research', 'new', 'Title: Recreation Manager. Imported from CSV', NULL, NOW(), NOW()),

('Wendy', 'Blanford', 'Puyallup Nazarene Church', 'wblanford@pnconline.org', '253-845-7508', '1026 7th Ave SW, Puyallup, WA 98371', 'Puyallup', 'WA', 'Puyallup Nazarene Church research', 'new', 'Title: Office Manager. Imported from CSV', NULL, NOW(), NOW()),

('Mike', 'Nelson', 'City of Puyallup Water Division', '', '253-841-5524', '333 S Meridian, Puyallup, WA 98371', 'Puyallup', 'WA', 'City of Puyallup research', 'new', 'Title: Cross Connection Specialist. Imported from CSV', NULL, NOW(), NOW()),

('D. William', 'Frame III', 'Kidder Mathews', 'bill.frame@kidder.com', '206-296-9600', '1201 Pacific Avenue Suite 1400, Tacoma, WA 98402', 'Tacoma', 'WA', 'Kidder Mathews research', 'new', 'Title: Chairman & Chief Executive Officer. Imported from CSV', NULL, NOW(), NOW()),

('Eric', 'Paulsen', 'Kidder Mathews', 'eric.paulsen@kidder.com', '949-557-5079', 'Orange County, CA', 'Orange County', 'CA', 'Kidder Mathews research', 'new', 'Title: Chief Operating Officer. Imported from CSV', NULL, NOW(), NOW()),

('Erin', 'French', 'Kidder Mathews', 'erin.french@kidder.com', '253-722-1437', '1201 Pacific Avenue Suite 1400, Tacoma, WA 98402', 'Tacoma', 'WA', 'Kidder Mathews research', 'new', 'Title: President of Asset Services. Imported from CSV', NULL, NOW(), NOW()),

('Brian', 'Hatcher', 'Kidder Mathews', 'brian.hatcher@kidder.com', '206-296-9634', '500 108th Ave NE Suite 2400, Bellevue, WA', 'Bellevue', 'WA', 'Kidder Mathews research', 'new', 'Title: Regional President – Brokerage (Pacific Northwest). Imported from CSV', NULL, NOW(), NOW());

-- Verify the import
SELECT COUNT(*) as total_leads FROM leads;
SELECT first_name, last_name, company_name, email, status FROM leads ORDER BY created_at DESC LIMIT 10;