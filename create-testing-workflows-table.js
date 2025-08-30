const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createTestingWorkflowsTable() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔧 Creating testing_workflows table...');

  try {
    // Create testing_workflows table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.testing_workflows (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
        device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
        customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
        technician_id UUID REFERENCES public.team_users(id) ON DELETE SET NULL,
        workflow_status TEXT CHECK (workflow_status IN ('scheduled', 'in_progress', 'testing', 'completed', 'failed')) DEFAULT 'scheduled',
        test_procedures JSONB DEFAULT '[]'::jsonb,
        equipment_checklist JSONB DEFAULT '[]'::jsonb,
        safety_checklist JSONB DEFAULT '[]'::jsonb,
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_testing_workflows_appointment_id ON public.testing_workflows(appointment_id);
      CREATE INDEX IF NOT EXISTS idx_testing_workflows_technician_id ON public.testing_workflows(technician_id);
      CREATE INDEX IF NOT EXISTS idx_testing_workflows_status ON public.testing_workflows(workflow_status);
      CREATE INDEX IF NOT EXISTS idx_testing_workflows_created_at ON public.testing_workflows(created_at);

      -- Enable RLS
      ALTER TABLE public.testing_workflows ENABLE ROW LEVEL SECURITY;

      -- Create RLS policy for service role access
      DROP POLICY IF EXISTS "service_role_full_access" ON public.testing_workflows;
      CREATE POLICY "service_role_full_access" ON public.testing_workflows 
        FOR ALL 
        USING (current_setting('request.jwt.claim.role', true) = 'service_role');

      -- Create trigger to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_testing_workflows_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_update_testing_workflows_updated_at ON public.testing_workflows;
      CREATE TRIGGER trigger_update_testing_workflows_updated_at
        BEFORE UPDATE ON public.testing_workflows
        FOR EACH ROW
        EXECUTE FUNCTION update_testing_workflows_updated_at();
    `;

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      console.log('❌ Error creating table:', error);
      
      // Try alternative approach - create table directly
      const { error: directError } = await supabase
        .from('testing_workflows')
        .select('*')
        .limit(1);
        
      if (directError && directError.message.includes('does not exist')) {
        console.log('🔧 Table does not exist, trying direct creation...');
        
        // Since we can't use exec_sql, let's create a minimal working version
        console.log('ℹ️  Please create the testing_workflows table in Supabase dashboard with this SQL:');
        console.log(createTableSQL);
        
        // For now, let's continue without the table and show what the API would do
        console.log('⚠️  Continuing test without table - API will return mock data');
      }
    } else {
      console.log('✅ testing_workflows table created successfully');
      
      // Test the table
      const { data: testData, error: testError } = await supabase
        .from('testing_workflows')
        .select('*')
        .limit(1);
        
      if (testError) {
        console.log('❌ Error testing table:', testError);
      } else {
        console.log('✅ Table is accessible and ready for use');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTestingWorkflowsTable();