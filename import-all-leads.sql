-- Import ALL 79 leads from expanded CSV data into the leads table
-- Run this in your Supabase SQL editor

-- First, clear existing leads if you want a fresh import (optional)
-- DELETE FROM leads;

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
-- Vista Property Management (10 contacts)
('Lori', 'Morrison', 'Vista Property Management', 'lori@govista.net', '253-881-3034', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: General Manager & Designated Broker', NULL, NOW(), NOW()),
('Julia', 'Radcliffe', 'Vista Property Management', 'julia@govista.net', '253-881-1206', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: Senior Property Manager', NULL, NOW(), NOW()),
('Lisa', 'McKenzie', 'Vista Property Management', 'lisa@govista.net', '253-881-3054', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: Property Manager', NULL, NOW(), NOW()),
('Sarah', 'Pignotti', 'Vista Property Management', 'sarah@govista.net', '253-881-3059', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: Accounting', NULL, NOW(), NOW()),
('Rita', 'Jefferson', 'Vista Property Management', 'rita@govista.net', '253-881-3051', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: Property Manager', NULL, NOW(), NOW()),
('Kim', 'Tarr', 'Vista Property Management', 'kim@govista.net', '253-881-3045', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: Maintenance Coordinator', NULL, NOW(), NOW()),
('Lynnette', 'Rohr', 'Vista Property Management', 'lynnette@govista.net', '253-881-3044', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: Accounting', NULL, NOW(), NOW()),
('Olivia', 'Lopez', 'Vista Property Management', 'olivia@govista.net', '253-881-3064', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: Property Manager', NULL, NOW(), NOW()),
('Bud', 'Ribitsch', 'Vista Property Management', 'bud@govista.net', '', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: Maintenance Technician', NULL, NOW(), NOW()),
('Merritt', 'Riley', 'Vista Property Management', 'mriley@govista.net', '253-881-3054', '1002 39th Ave SW Ste 302, Puyallup, WA 98373', 'Puyallup', 'WA', 'Vista Property Management research', 'new', 'Title: Owner', NULL, NOW(), NOW()),

-- Integrity Property Management (5 contacts)
('Stevelle', 'Resutek', 'Integrity Property Management', 'stevelle@integrityrentals.com', '253-466-3588 ext 7', '10309 Canyon Rd E, Puyallup, WA 98373', 'Puyallup', 'WA', 'Integrity Property Management research', 'new', 'Title: Designated Broker-Owner', NULL, NOW(), NOW()),
('Catherine', 'Allen', 'Integrity Property Management', 'cathy@integrityrentals.com', '253-466-3588 ext 2', '10309 Canyon Rd E, Puyallup, WA 98373', 'Puyallup', 'WA', 'Integrity Property Management research', 'new', 'Title: Bookkeeper', NULL, NOW(), NOW()),
('Sandy', 'Boldenow', 'Integrity Property Management', 'sandy@integrityre.net', '253-466-3588 ext 5', '10309 Canyon Rd E, Puyallup, WA 98373', 'Puyallup', 'WA', 'Integrity Property Management research', 'new', 'Title: Broker/Property Manager', NULL, NOW(), NOW()),
('Kiley', 'Narlock', 'Integrity Property Management', 'kiley@integrityrentals.com', '253-466-3588 ext 4', '10309 Canyon Rd E, Puyallup, WA 98373', 'Puyallup', 'WA', 'Integrity Property Management research', 'new', 'Title: Broker/Property Manager', NULL, NOW(), NOW()),
('Cheryl', 'Kehoe', 'Integrity Property Management', 'clkehoe@hotmail.com', '253-466-3588', '10309 Canyon Rd E, Puyallup, WA 98373', 'Puyallup', 'WA', 'Integrity Property Management research', 'new', 'Title: Broker - Sales', NULL, NOW(), NOW()),

-- Puyallup School District (2 contacts)
('Phillip', 'Anderson', 'Puyallup School District', '', '253-841-8777', '323 12th St NW, Puyallup, WA 98371', 'Puyallup', 'WA', 'Puyallup School District research', 'new', 'Title: Director of Maintenance', NULL, NOW(), NOW()),
('Heidi', 'Ashlock', 'Puyallup School District', 'ashlocHM@puyallupsd.org', '253-841-8758', '302 2nd St SE, Puyallup, WA 98372', 'Puyallup', 'WA', 'Puyallup School District research', 'new', 'Title: Facility Use Manager', NULL, NOW(), NOW()),

-- MK Property Services (14 contacts)
('Lara', 'Pharmer', 'MK Property Services', 'lara@mkps.net', '425-888-2993', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Sr. Property Manager/Broker', NULL, NOW(), NOW()),
('Gina', 'Roberts', 'MK Property Services', 'gina@mkps.net', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Sr. Property Administrator', NULL, NOW(), NOW()),
('Marielle', 'De La Torre', 'MK Property Services', 'marielle@mkps.net', '425-818-4159', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: COO/Broker', NULL, NOW(), NOW()),
('Radric', 'Marapao', 'MK Property Services', 'radric@mkps.net', '425-818-4154', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Broker/Executive Assistant', NULL, NOW(), NOW()),
('Marcey', 'Nuccitelli', 'MK Property Services', 'marcey.nuccitelli@gmail.com', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Property Manager/Broker', NULL, NOW(), NOW()),
('Marvie', 'Kirkland', 'MK Property Services', 'marvie@mkps.net', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Controller', NULL, NOW(), NOW()),
('Mike', 'Kirkland', 'MK Property Services', 'mike@mkps.net', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Owner/Designated Broker', NULL, NOW(), NOW()),
('Stephen', 'Heffington', 'MK Property Services', 'stephen@mkps.net', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Accounting Specialist', NULL, NOW(), NOW()),
('Sydena', 'Severe', 'MK Property Services', 'syd@mkps.net', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Chief Business Development Officer, Broker', NULL, NOW(), NOW()),
('Trish', 'Gallagher', 'MK Property Services', 'trish@mkps.net', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Property Manager/Broker', NULL, NOW(), NOW()),
('Valerie', 'Dimick', 'MK Property Services', 'valerie@mkps.net', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Senior Accounting Specialist', NULL, NOW(), NOW()),
('Dawn', 'Hardley', 'MK Property Services', 'dawn@mkps.net', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Property Manager/Broker', NULL, NOW(), NOW()),
('Kristie', 'Herman', 'MK Property Services', 'kristie@mkps.net', '', '8124 Falls Avenue SE, Snoqualmie, WA 98065', 'Snoqualmie', 'WA', 'MK Property Services research', 'new', 'Title: Accounting Specialist', NULL, NOW(), NOW()),

-- City of Puyallup (3 contacts)
('Deon', 'Moyd', 'City of Puyallup Parks & Recreation', 'deon@puyallupwa.gov', '253-841-4321', '808 Valley Ave NW, Puyallup, WA 98371', 'Puyallup', 'WA', 'City of Puyallup research', 'new', 'Title: Recreation Manager', NULL, NOW(), NOW()),
('Mike', 'Nelson', 'City of Puyallup Water Division', '', '253-841-5524', '333 S Meridian, Puyallup, WA 98371', 'Puyallup', 'WA', 'City of Puyallup research', 'new', 'Title: Cross Connection Specialist', NULL, NOW(), NOW()),

-- Other Puyallup Organizations
('Wendy', 'Blanford', 'Puyallup Nazarene Church', 'wblanford@pnconline.org', '253-845-7508', '1026 7th Ave SW, Puyallup, WA 98371', 'Puyallup', 'WA', 'Puyallup Nazarene Church research', 'new', 'Title: Office Manager', NULL, NOW(), NOW()),
('Darrin', 'Shaw', 'Central Pierce Fire & Rescue', 'info@centralpiercefire.org', '253-538-6400', '1015 39th Ave SE Suite 120, Puyallup, WA 98374', 'Puyallup', 'WA', 'Central Pierce Fire & Rescue research', 'new', 'Title: Central Pierce Fire & Rescue Representative', NULL, NOW(), NOW()),

-- Windermere (2 contacts)
('Rachel', 'Smith', 'Windermere Property Management / South Sound', 'rachelsmith@windermere.com', '253-359-2300', '12114 104th Ave E, Puyallup, WA 98374', 'Puyallup', 'WA', 'Windermere research', 'new', 'Title: Property Manager', NULL, NOW(), NOW()),
('J. Michael', 'Wilson', 'Windermere Real Estate', 'MikeWilson@windermere.com', '206-621-2037', '12114 104th Ave E, Puyallup, WA 98374', 'Puyallup', 'WA', 'Windermere research', 'new', 'Title: Owner / Principal', NULL, NOW(), NOW()),

-- Kidder Mathews (4 contacts)
('D. William', 'Frame III', 'Kidder Mathews', 'bill.frame@kidder.com', '206-296-9600', '1201 Pacific Avenue Suite 1400, Tacoma, WA 98402', 'Tacoma', 'WA', 'Kidder Mathews research', 'new', 'Title: Chairman & Chief Executive Officer', NULL, NOW(), NOW()),
('Eric', 'Paulsen', 'Kidder Mathews', 'eric.paulsen@kidder.com', '949-557-5079', 'Orange County, CA', 'Orange County', 'CA', 'Kidder Mathews research', 'new', 'Title: Chief Operating Officer', NULL, NOW(), NOW()),
('Erin', 'French', 'Kidder Mathews', 'erin.french@kidder.com', '253-722-1437', '1201 Pacific Avenue Suite 1400, Tacoma, WA 98402', 'Tacoma', 'WA', 'Kidder Mathews research', 'new', 'Title: President of Asset Services', NULL, NOW(), NOW()),
('Brian', 'Hatcher', 'Kidder Mathews', 'brian.hatcher@kidder.com', '206-296-9634', '500 108th Ave NE Suite 2400, Bellevue, WA', 'Bellevue', 'WA', 'Kidder Mathews research', 'new', 'Title: Regional President – Brokerage (Pacific Northwest)', NULL, NOW(), NOW()),

-- Guide Property Services (32 contacts)
('John', 'Garvin', 'Guide Property Services', 'jgarvin@guidepm.com', '206-283-0602', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Principal', NULL, NOW(), NOW()),
('Scott', 'Kim', 'Guide Property Services', 'skim@guidepm.com', '206-928-7969', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Chief Financial Officer', NULL, NOW(), NOW()),
('Sara', 'Brown', 'Guide Property Services', 'sbrown@guidepm.com', '206-710-1257', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Director of Property Management', NULL, NOW(), NOW()),
('Adi', 'Alfaro', 'Guide Property Services', 'adi@guidepm.com', '206-501-5328', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Portfolio Manager', NULL, NOW(), NOW()),
('Alycia', 'Miller', 'Guide Property Services', 'alycia@guidepm.com', '206-931-9724', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Portfolio Manager', NULL, NOW(), NOW()),
('Jodie', 'Yost', 'Guide Property Services', 'jodie@guidepm.com', '206-690-6104', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Portfolio Manager', NULL, NOW(), NOW()),
('Aimee', 'Hilton', 'Guide Property Services', 'aimee@guidepm.com', '206-931-9765', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Portfolio Manager', NULL, NOW(), NOW()),
('Colin', 'Ward', 'Guide Property Services', 'colin@guidepm.com', '208-671-1874', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Portfolio Manager', NULL, NOW(), NOW()),
('Ashleigh', 'Groen', 'Guide Property Services', 'ashleigh@guidepm.com', '206-504-3387', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Portfolio Manager', NULL, NOW(), NOW()),
('Cristi', 'Amble', 'Guide Property Services', 'cristi@guidepm.com', '206-360-1210', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Property Manager', NULL, NOW(), NOW()),
('Dotty', 'Nuetzmann', 'Guide Property Services', 'dotty@guidepm.com', '425-783-9282', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Property Manager', NULL, NOW(), NOW()),
('Alec', 'Johnson', 'Guide Property Services', 'alec@guidepm.com', '253-649-9575', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Property Manager', NULL, NOW(), NOW()),
('Alice', 'Hazelton', 'Guide Property Services', 'alice@guidepm.com', '206-848-1835', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Property Manager', NULL, NOW(), NOW()),
('Amelia', 'Rockcastle', 'Guide Property Services', 'amelia@guidepm.com', '206-538-2569', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Property Manager', NULL, NOW(), NOW()),
('Cameron', 'Salcido', 'Guide Property Services', 'cameron@guidepm.com', '206-580-0758', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Property Manager', NULL, NOW(), NOW()),
('Luis', 'Anguiano', 'Guide Property Services', 'luis@guidepm.com', '206-485-2932', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Property Manager', NULL, NOW(), NOW()),
('Ashleigh', 'Ford', 'Guide Property Services', 'aford@guidepm.com', '206-565-2152', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Property Manager', NULL, NOW(), NOW()),
('Autumn', 'Rooks', 'Guide Property Services', 'arooks@guidepm.com', '206-462-1910', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Property Manager', NULL, NOW(), NOW()),
('Tate', 'Stoner', 'Guide Property Services', 'tate@guidepm.com', '206-647-3362', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Leasing Professional', NULL, NOW(), NOW()),
('Destiny', 'Reynolds', 'Guide Property Services', 'destiny@guidepm.com', '208-997-9009', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Property Manager', NULL, NOW(), NOW()),
('Dion', 'Salinas', 'Guide Property Services', 'dion@guidepm.com', '208-231-8355', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Property Manager', NULL, NOW(), NOW()),
('Chemire', 'Williams', 'Guide Property Services', 'cwilliams@guidepm.com', '206-338-5563', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Property Manager', NULL, NOW(), NOW()),
('Isobel', 'Alessandro', 'Guide Property Services', 'ialessandro@guidepm.com', '206-462-1510', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Property Manager', NULL, NOW(), NOW()),
('Lu', 'LaMagra', 'Guide Property Services', 'lu@guidepm.com', '206-738-7422', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Assistant Property Manager', NULL, NOW(), NOW()),
('KZ', 'Sotaridona', 'Guide Property Services', 'kim@guidepm.com', '206-364-1000', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Leasing Professional', NULL, NOW(), NOW()),
('Kili', 'Anderson', 'Guide Property Services', 'kanderson@guidepm.com', '206-803-4269', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Portfolio Accountant', NULL, NOW(), NOW()),
('Halle', 'Lynn', 'Guide Property Services', 'halle@guidepm.com', '', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Office Manager', NULL, NOW(), NOW()),
('Kim', 'Seng', 'Guide Property Services', 'kseng@guidepm.com', '', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Accounting Manager', NULL, NOW(), NOW()),
('Linda', 'Batbayar', 'Guide Property Services', 'lbatbayar@guidepm.com', '', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Portfolio Accountant', NULL, NOW(), NOW()),
('Dustin', 'Hampton', 'Guide Property Services', 'dustin@guidepm.com', '206-371-8333', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Project Manager', NULL, NOW(), NOW()),
('Morgan', 'McKean', 'Guide Property Services', 'mmckean@guidepm.com', '253-888-5001', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Project Coordinator', NULL, NOW(), NOW()),
('John', 'Finlay', 'Guide Property Services', 'jfinlay@guidepm.com', '206-375-8538', '1500 Westlake Ave N Suite 212, Seattle, WA 98109', 'Seattle', 'WA', 'Guide Property Services research', 'new', 'Title: Maintenance Coordinator', NULL, NOW(), NOW()),

-- Real Property Associates (4 contacts)
('Dominic', 'Montello', 'Real Property Associates', 'dominic@rpapm.com', '206-577-0835', 'Seattle, WA', 'Seattle', 'WA', 'Real Property Associates research', 'new', 'Title: PM Assistant', NULL, NOW(), NOW()),
('Barbara', 'Hartley', 'Real Property Associates', 'bhartley@rpapm.com', '206-577-0587', 'Seattle, WA', 'Seattle', 'WA', 'Real Property Associates research', 'new', 'Title: Senior Property Manager', NULL, NOW(), NOW()),
('Arron', 'Renfrew', 'Real Property Associates', 'renfrew@rpapm.com', '206-659-5006', 'Seattle, WA', 'Seattle', 'WA', 'Real Property Associates research', 'new', 'Title: Property Manager', NULL, NOW(), NOW()),
('Annie', 'Eugster', 'Real Property Associates', 'annie@rpapm.com', '206-523-0300', 'Seattle, WA', 'Seattle', 'WA', 'Real Property Associates research', 'new', 'Title: Director of Marketing, Sales and Onboarding', NULL, NOW(), NOW());

-- Verify the import
SELECT COUNT(*) as total_leads FROM leads;
SELECT company_name, COUNT(*) as contacts FROM leads GROUP BY company_name ORDER BY contacts DESC;
SELECT first_name, last_name, company_name, email, status FROM leads ORDER BY created_at DESC LIMIT 10;