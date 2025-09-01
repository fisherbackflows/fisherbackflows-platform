#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function createMockSession() {
  console.log('🔄 Creating mock session for testing...');
  
  try {
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
    );

    // Get admin user from team_users
    const { data: teamUser, error: userError } = await supabase
      .from('team_users')
      .select('*')
      .eq('email', 'admin@fisherbackflows.com')
      .single();
      
    if (userError || !teamUser) {
      console.error('❌ Admin user not found:', userError?.message);
      return;
    }
    
    console.log('✅ Found admin user:', teamUser.first_name, teamUser.last_name);
    
    // Create a session token
    const sessionToken = 'mock-session-' + Date.now();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Try to create a session in the database
    const { data: session, error: sessionError } = await supabase
      .from('team_sessions')
      .upsert({
        team_user_id: teamUser.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        ip_address: '127.0.0.1',
        user_agent: 'API Test Script'
      })
      .select()
      .single();
      
    if (sessionError) {
      console.error('❌ Failed to create session:', sessionError.message);
      
      // If database session fails, create mock session in global memory
      console.log('🔄 Creating global mock session...');
      global.mockTeamSessions = global.mockTeamSessions || {};
      global.mockTeamSessions[sessionToken] = {
        user: teamUser,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      };
      
      console.log('✅ Global mock session created');
    } else {
      console.log('✅ Database session created:', session.session_token);
    }
    
    // Test the session by making API calls
    console.log('\n🧪 Testing API with session...');
    
    const fetch = require('node-fetch');
    const baseURL = 'http://localhost:3010';
    
    // Test invoice API
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id')
      .limit(1);
      
    if (invoices?.length) {
      const testInvoiceId = invoices[0].id;
      
      console.log(`🔍 Testing invoice API with session token: ${sessionToken.substring(0, 20)}...`);
      
      const response = await fetch(`${baseURL}/api/invoices/${testInvoiceId}`, {
        method: 'GET',
        headers: {
          'Cookie': `team_session=${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Invoice API working with session!');
        console.log(`  📄 Invoice: ${data.number}`);
        console.log(`  👤 Customer: ${data.customerName}`);
      } else {
        console.log('❌ Invoice API still failing:', response.status);
        const errorText = await response.text();
        console.log('   Error:', errorText);
      }
    }
    
    console.log('\n🎉 Mock session setup completed!');
    console.log(`Session token: ${sessionToken}`);
    console.log('Use this in your Cookie header as: team_session=' + sessionToken);
    
    // Save session info for other scripts
    require('fs').writeFileSync(
      './test-session.json', 
      JSON.stringify({
        sessionToken,
        teamUser: {
          id: teamUser.id,
          email: teamUser.email,
          role: teamUser.role,
          firstName: teamUser.first_name,
          lastName: teamUser.last_name
        },
        expiresAt: expiresAt.toISOString()
      }, null, 2)
    );
    
    console.log('✅ Session info saved to test-session.json');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

createMockSession();