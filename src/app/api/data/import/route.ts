import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/lib/auth';
import { generateId } from '@/lib/utils';

interface ImportResult {
  success: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  warnings: Array<{
    row: number;
    message: string;
  }>;
}

// POST - Import data from CSV/JSON
export async function POST(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dataType = formData.get('dataType') as string;
    const updateExisting = formData.get('updateExisting') === 'true';
    const skipValidation = formData.get('skipValidation') === 'true';

    if (!file || !dataType) {
      return NextResponse.json(
        { error: 'File and data type are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!['csv', 'json'].includes(fileExtension || '')) {
      return NextResponse.json(
        { error: 'Only CSV and JSON files are supported' },
        { status: 400 }
      );
    }

    // Parse file content
    const fileContent = await file.text();
    let records: any[] = [];

    try {
      if (fileExtension === 'json') {
        const jsonData = JSON.parse(fileContent);
        records = Array.isArray(jsonData) ? jsonData : [jsonData];
      } else {
        // Parse CSV
        const lines = fileContent.trim().split('\n');
        if (lines.length < 2) {
          return NextResponse.json(
            { error: 'CSV file must have at least a header row and one data row' },
            { status: 400 }
          );
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        records = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const record: any = {};
          headers.forEach((header, i) => {
            record[header] = values[i] || null;
          });
          return record;
        });
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Failed to parse file: ' + (parseError as Error).message },
        { status: 400 }
      );
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'No data found in file' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin || createRouteHandlerClient(request);
    const result: ImportResult = {
      success: 0,
      errors: [],
      warnings: []
    };

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +2 for 1-based indexing and header row

      try {
        let processedRecord: any = {};
        let shouldInsert = true;

        switch (dataType) {
          case 'customers':
            processedRecord = await processCustomerRecord(record, rowNumber, result, skipValidation);
            if (processedRecord && updateExisting && record.email) {
              // Check if customer exists
              const { data: existing } = await supabase
                .from('customers')
                .select('id')
                .eq('email', record.email)
                .single();
              
              if (existing) {
                // Update existing customer
                const { error: updateError } = await supabase
                  .from('customers')
                  .update(processedRecord)
                  .eq('id', existing.id);

                if (updateError) {
                  result.errors.push({ row: rowNumber, error: updateError.message, data: record });
                } else {
                  result.success++;
                  result.warnings.push({ row: rowNumber, message: 'Updated existing customer' });
                }
                shouldInsert = false;
              }
            }
            break;

          case 'devices':
            processedRecord = await processDeviceRecord(record, rowNumber, result, skipValidation, supabase);
            if (processedRecord && updateExisting && record.serial_number) {
              const { data: existing } = await supabase
                .from('devices')
                .select('id')
                .eq('serial_number', record.serial_number)
                .single();
              
              if (existing) {
                const { error: updateError } = await supabase
                  .from('devices')
                  .update(processedRecord)
                  .eq('id', existing.id);

                if (updateError) {
                  result.errors.push({ row: rowNumber, error: updateError.message, data: record });
                } else {
                  result.success++;
                  result.warnings.push({ row: rowNumber, message: 'Updated existing device' });
                }
                shouldInsert = false;
              }
            }
            break;

          case 'appointments':
            processedRecord = await processAppointmentRecord(record, rowNumber, result, skipValidation, supabase);
            break;

          default:
            result.errors.push({ row: rowNumber, error: `Unsupported data type: ${dataType}`, data: record });
            continue;
        }

        // Insert new record if needed
        if (shouldInsert && processedRecord) {
          const { error: insertError } = await supabase
            .from(dataType)
            .insert(processedRecord);

          if (insertError) {
            result.errors.push({ row: rowNumber, error: insertError.message, data: record });
          } else {
            result.success++;
          }
        }

      } catch (error) {
        result.errors.push({ 
          row: rowNumber, 
          error: (error as Error).message, 
          data: record 
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${result.success} successful, ${result.errors.length} errors, ${result.warnings.length} warnings`,
      result: result,
      summary: {
        total_records: records.length,
        successful: result.success,
        errors: result.errors.length,
        warnings: result.warnings.length
      }
    });

  } catch (error) {
    console.error('Import API error:', error);
    return NextResponse.json(
      { error: 'Server error during import: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

async function processCustomerRecord(record: any, rowNumber: number, result: ImportResult, skipValidation: boolean) {
  // Validate required fields
  if (!skipValidation) {
    if (!record.first_name || !record.last_name || !record.email) {
      result.errors.push({ 
        row: rowNumber, 
        error: 'Missing required fields: first_name, last_name, email', 
        data: record 
      });
      return null;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(record.email)) {
      result.errors.push({ 
        row: rowNumber, 
        error: 'Invalid email format', 
        data: record 
      });
      return null;
    }
  }

  return {
    account_number: record.account_number || generateId('FB'),
    first_name: record.first_name?.trim(),
    last_name: record.last_name?.trim(),
    email: record.email?.toLowerCase().trim(),
    phone: record.phone?.trim() || null,
    address_line1: record.address_line1?.trim() || null,
    address_line2: record.address_line2?.trim() || null,
    city: record.city?.trim() || null,
    state: record.state?.trim() || null,
    zip_code: record.zip_code?.trim() || null,
    account_status: record.account_status || 'active',
    created_at: new Date().toISOString()
  };
}

async function processDeviceRecord(record: any, rowNumber: number, result: ImportResult, skipValidation: boolean, supabase: any) {
  if (!skipValidation) {
    if (!record.customer_email && !record.customer_id) {
      result.errors.push({ 
        row: rowNumber, 
        error: 'Either customer_email or customer_id is required', 
        data: record 
      });
      return null;
    }

    if (!record.make || !record.model) {
      result.errors.push({ 
        row: rowNumber, 
        error: 'Device make and model are required', 
        data: record 
      });
      return null;
    }
  }

  // Find customer ID if email provided
  let customerId = record.customer_id;
  if (!customerId && record.customer_email) {
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', record.customer_email.toLowerCase().trim())
      .single();

    if (customer) {
      customerId = customer.id;
    } else {
      result.errors.push({ 
        row: rowNumber, 
        error: `Customer not found with email: ${record.customer_email}`, 
        data: record 
      });
      return null;
    }
  }

  return {
    customer_id: customerId,
    device_type: record.device_type || 'RP',
    make: record.make?.trim(),
    model: record.model?.trim(),
    size_inches: record.size_inches || '3/4"',
    serial_number: record.serial_number?.trim() || null,
    location: record.location?.trim() || null,
    install_date: record.install_date ? new Date(record.install_date).toISOString().split('T')[0] : null,
    last_test_date: record.last_test_date ? new Date(record.last_test_date).toISOString().split('T')[0] : null,
    next_test_due: record.next_test_due ? new Date(record.next_test_due).toISOString().split('T')[0] : null,
    is_active: record.is_active !== 'false' && record.is_active !== false,
    created_at: new Date().toISOString()
  };
}

async function processAppointmentRecord(record: any, rowNumber: number, result: ImportResult, skipValidation: boolean, supabase: any) {
  if (!skipValidation) {
    if (!record.customer_email && !record.customer_id) {
      result.errors.push({ 
        row: rowNumber, 
        error: 'Either customer_email or customer_id is required', 
        data: record 
      });
      return null;
    }

    if (!record.scheduled_date || !record.scheduled_time_start) {
      result.errors.push({ 
        row: rowNumber, 
        error: 'Scheduled date and time are required', 
        data: record 
      });
      return null;
    }
  }

  // Find customer ID
  let customerId = record.customer_id;
  if (!customerId && record.customer_email) {
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', record.customer_email.toLowerCase().trim())
      .single();

    if (customer) {
      customerId = customer.id;
    } else {
      result.errors.push({ 
        row: rowNumber, 
        error: `Customer not found with email: ${record.customer_email}`, 
        data: record 
      });
      return null;
    }
  }

  // Find technician ID if provided
  let technicianId = record.technician_id || null;
  if (!technicianId && record.technician_email) {
    const { data: technician } = await supabase
      .from('team_users')
      .select('id')
      .eq('email', record.technician_email.toLowerCase().trim())
      .eq('is_active', true)
      .single();

    if (technician) {
      technicianId = technician.id;
    } else {
      result.warnings.push({ 
        row: rowNumber, 
        message: `Technician not found with email: ${record.technician_email}` 
      });
    }
  }

  return {
    customer_id: customerId,
    technician_id: technicianId,
    appointment_type: record.appointment_type || 'annual_test',
    scheduled_date: record.scheduled_date,
    scheduled_time_start: record.scheduled_time_start,
    estimated_duration: parseInt(record.estimated_duration) || 60,
    special_instructions: record.special_instructions?.trim() || null,
    status: record.status || 'scheduled',
    created_at: new Date().toISOString()
  };
}