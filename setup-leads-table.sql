-- Create leads table if it doesn't exist
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company_name TEXT,
    title TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    source TEXT DEFAULT 'imported',
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    estimated_value DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    assigned_to TEXT DEFAULT 'Unassigned',
    contacted_date TIMESTAMPTZ,
    qualified_date TIMESTAMPTZ,
    converted_date TIMESTAMPTZ,
    converted_customer_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger for leads table
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create lead_activity table for tracking interactions
CREATE TABLE IF NOT EXISTS lead_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    user TEXT DEFAULT 'System',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_activity_lead_id ON lead_activity(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activity_created_at ON lead_activity(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activity ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (adjust based on your auth setup)
-- Allow all operations for now (you may want to restrict this later)
CREATE POLICY IF NOT EXISTS "Allow all operations on leads" ON leads
    FOR ALL USING (true);

CREATE POLICY IF NOT EXISTS "Allow all operations on lead_activity" ON lead_activity
    FOR ALL USING (true);