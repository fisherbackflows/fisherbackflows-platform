import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { dataExportService } from '@/lib/data-export';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Read file content
    const fileContent = await file.text();
    let importData: any[] = [];
    
    // Parse file based on extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      switch (fileExtension) {
        case 'csv':
          importData = await dataExportService.parseCSV(fileContent);
          break;
        case 'json':
          importData = JSON.parse(fileContent);
          if (!Array.isArray(importData)) {
            throw new Error('JSON file must contain an array of records');
          }
          break;
        default:
          return NextResponse.json(
            { error: 'Unsupported file format. Please use CSV or JSON files.' },
            { status: 400 }
          );
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: `Failed to parse file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` },
        { status: 400 }
      );
    }

    if (importData.length === 0) {
      return NextResponse.json(
        { error: 'No data found in file' },
        { status: 400 }
      );
    }

    // Validate and import data based on type
    let result;
    
    switch (type) {
      case 'customers':
        result = await importCustomers(supabase, importData);
        break;
      case 'test_reports':
        result = await importTestReports(supabase, importData);
        break;
      case 'appointments':
        result = await importAppointments(supabase, importData);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid import type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Import failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function importCustomers(supabase: any, data: any[]) {
  const results = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[]
  };

  for (const [index, record] of data.entries()) {
    try {
      // Validate required fields
      if (!record.name || !record.email) {
        results.errors.push(`Row ${index + 1}: Missing required fields (name, email)`);
        results.skipped++;
        continue;
      }

      // Normalize the data
      const customerData = {
        name: record.name,
        email: record.email.toLowerCase(),
        phone: record.phone || null,
        address: record.address || null,
        city: record.city || null,
        state: record.state || null,
        zip_code: record.zip_code || record.zipCode || null,
        account_number: record.account_number || record.accountNumber || null,
        service_address: record.service_address || record.serviceAddress || null,
        billing_address: record.billing_address || record.billingAddress || null,
        notes: record.notes || null
      };

      // Check if customer exists (by email or account number)
      const { data: existing } = await supabase
        .from('customers')
        .select('customer_id')
        .or(`email.eq.${customerData.email},account_number.eq.${customerData.account_number}`)
        .single();

      if (existing) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('customer_id', existing.customer_id);

        if (error) {
          results.errors.push(`Row ${index + 1}: Update failed - ${error.message}`);
          results.skipped++;
        } else {
          results.updated++;
        }
      } else {
        // Insert new customer
        const { error } = await supabase
          .from('customers')
          .insert(customerData);

        if (error) {
          results.errors.push(`Row ${index + 1}: Insert failed - ${error.message}`);
          results.skipped++;
        } else {
          results.imported++;
        }
      }

    } catch (error) {
      results.errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.skipped++;
    }
  }

  return results;
}

async function importTestReports(supabase: any, data: any[]) {
  const results = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[]
  };

  for (const [index, record] of data.entries()) {
    try {
      // Validate required fields
      if (!record.device_id || !record.test_date) {
        results.errors.push(`Row ${index + 1}: Missing required fields (device_id, test_date)`);
        results.skipped++;
        continue;
      }

      // Verify device exists
      const { data: device } = await supabase
        .from('devices')
        .select('device_id')
        .eq('device_id', record.device_id)
        .single();

      if (!device) {
        results.errors.push(`Row ${index + 1}: Device ${record.device_id} not found`);
        results.skipped++;
        continue;
      }

      const reportData = {
        device_id: record.device_id,
        test_date: record.test_date,
        technician_id: record.technician_id || null,
        test_type: record.test_type || 'annual',
        status: record.status || 'completed',
        compliance_status: record.compliance_status || null,
        pressure_reading: parseFloat(record.pressure_reading) || null,
        flow_rate: parseFloat(record.flow_rate) || null,
        temperature: parseFloat(record.temperature) || null,
        notes: record.notes || null,
        attachments: record.attachments || null
      };

      // Insert test report (assuming no duplicates check needed)
      const { error } = await supabase
        .from('test_reports')
        .insert(reportData);

      if (error) {
        results.errors.push(`Row ${index + 1}: Insert failed - ${error.message}`);
        results.skipped++;
      } else {
        results.imported++;
      }

    } catch (error) {
      results.errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.skipped++;
    }
  }

  return results;
}

async function importAppointments(supabase: any, data: any[]) {
  const results = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[]
  };

  for (const [index, record] of data.entries()) {
    try {
      // Validate required fields
      if (!record.customer_id || !record.scheduled_date) {
        results.errors.push(`Row ${index + 1}: Missing required fields (customer_id, scheduled_date)`);
        results.skipped++;
        continue;
      }

      // Verify customer exists
      const { data: customer } = await supabase
        .from('customers')
        .select('customer_id')
        .eq('customer_id', record.customer_id)
        .single();

      if (!customer) {
        results.errors.push(`Row ${index + 1}: Customer ${record.customer_id} not found`);
        results.skipped++;
        continue;
      }

      const appointmentData = {
        customer_id: record.customer_id,
        technician_id: record.technician_id || null,
        scheduled_date: record.scheduled_date,
        estimated_duration: parseInt(record.estimated_duration) || 60,
        service_type: record.service_type || 'testing',
        status: record.status || 'scheduled',
        notes: record.notes || null,
        internal_notes: record.internal_notes || null
      };

      // Insert appointment
      const { error } = await supabase
        .from('appointments')
        .insert(appointmentData);

      if (error) {
        results.errors.push(`Row ${index + 1}: Insert failed - ${error.message}`);
        results.skipped++;
      } else {
        results.imported++;
      }

    } catch (error) {
      results.errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.skipped++;
    }
  }

  return results;
}