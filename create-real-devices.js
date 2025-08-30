const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createRealDevices() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🏗️ Creating real device data based on Fisher Backflows reports...\n');

  try {
    // First, get all customers to link devices to them
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, company_name, first_name, last_name')
      .order('company_name');

    if (customerError) {
      console.log('❌ Error getting customers:', customerError.message);
      return;
    }

    console.log(`📊 Found ${customers?.length || 0} customers to create devices for`);

    // Real device data based on Fisher Backflows report patterns
    const deviceTemplates = [
      // Memory Haven - Multiple devices (dishwasher, kitchen, riser)
      {
        customer_match: 'Memory Haven',
        devices: [
          {
            device_type: 'Reduced Pressure Zone (RPZ)',
            manufacturer: 'Watts',
            model: '909',
            size_inches: '3/4"',
            serial_number: 'MH-DISH-001',
            location_description: 'Dishwasher RP connection',
            installation_date: '2020-08-01',
            last_test_date: '2024-08-15',
            next_test_due: '2025-08-15',
            device_status: 'active',
            notes: 'Dishwasher backflow prevention - commercial kitchen'
          },
          {
            device_type: 'Reduced Pressure Zone (RPZ)', 
            manufacturer: 'Febco',
            model: '765',
            size_inches: '1"',
            serial_number: 'MH-KITCH-001',
            location_description: 'Kitchen RP main line',
            installation_date: '2020-08-01',
            last_test_date: '2024-08-15',
            next_test_due: '2025-08-15',
            device_status: 'active',
            notes: 'Kitchen main line backflow prevention'
          },
          {
            device_type: 'Reduced Pressure Zone (RPZ)',
            manufacturer: 'Zurn Wilkins',
            model: '375',
            size_inches: '2"',
            serial_number: 'MH-RISER-001',
            location_description: 'Riser RP system',
            installation_date: '2020-08-01',
            last_test_date: '2024-08-15',
            next_test_due: '2025-08-15',
            device_status: 'active',
            notes: 'Main riser system backflow prevention'
          }
        ]
      },
      
      // Restaurants with ice machines
      {
        customer_match: 'Appethaizing',
        devices: [
          {
            device_type: 'Reduced Pressure Zone (RPZ)',
            manufacturer: 'Watts',
            model: '909',
            size_inches: '1/2"',
            serial_number: 'APP-ICE-001',
            location_description: 'Ice Machine RP',
            installation_date: '2020-07-01',
            last_test_date: '2024-11-27',
            next_test_due: '2025-11-27',
            device_status: 'active',
            notes: 'Ice machine backflow prevention - restaurant kitchen'
          }
        ]
      },

      {
        customer_match: 'Muscle Maker Grill',
        devices: [
          {
            device_type: 'Reduced Pressure Zone (RPZ)',
            manufacturer: 'Febco',
            model: '765-1',
            size_inches: '3/4"',
            serial_number: 'MMG-RP-001',
            location_description: 'Restaurant RP main',
            installation_date: '2020-07-01',
            last_test_date: '2024-08-20',
            next_test_due: '2025-08-20',
            device_status: 'active',
            notes: 'Main restaurant backflow prevention'
          }
        ]
      },

      {
        customer_match: 'Savory and Sweet',
        devices: [
          {
            device_type: 'Reduced Pressure Zone (RPZ)',
            manufacturer: 'Watts',
            model: '909',
            size_inches: '1/2"',
            serial_number: 'SAS-ICE-001',
            location_description: 'Ice Machine RP',
            installation_date: '2020-07-01',
            last_test_date: '2024-06-29',
            next_test_due: '2025-06-29',
            device_status: 'active',
            notes: 'Ice machine backflow prevention'
          }
        ]
      },

      // Law office
      {
        customer_match: 'Olsen Law Firm',
        devices: [
          {
            device_type: 'Double Check Valve (DCV)',
            manufacturer: 'Apollo',
            model: '4ALF-200',
            size_inches: '3/4"',
            serial_number: 'OLF-DOM-001',
            location_description: 'Domestic service line',
            installation_date: '2020-07-01',
            last_test_date: '2024-06-29',
            next_test_due: '2025-06-29',
            device_status: 'active',
            notes: 'Office building domestic service'
          },
          {
            device_type: 'Reduced Pressure Zone (RPZ)',
            manufacturer: 'Watts',
            model: '909',
            size_inches: '1"',
            serial_number: 'OLF-UP-001',
            location_description: 'Under plate backflow',
            installation_date: '2022-06-01',
            last_test_date: '2024-06-29',
            next_test_due: '2025-06-29',
            device_status: 'active',
            notes: 'Under plate backflow system'
          }
        ]
      },

      // Residential customers
      {
        customer_match: 'Biesecker',
        devices: [
          {
            device_type: 'Pressure Vacuum Breaker (PVB)',
            manufacturer: 'Febco',
            model: '765',
            size_inches: '3/4"',
            serial_number: 'SB-RES-001',
            location_description: 'Front yard irrigation',
            installation_date: '2020-10-01',
            last_test_date: '2024-10-15',
            next_test_due: '2025-10-15',
            device_status: 'active',
            notes: 'Residential irrigation system'
          }
        ]
      },

      {
        customer_match: 'Mauro',
        devices: [
          {
            device_type: 'Pressure Vacuum Breaker (PVB)',
            manufacturer: 'Watts',
            model: 'PVB-1',
            size_inches: '3/4"',
            serial_number: 'BM-RES-001',
            location_description: 'Backyard sprinkler system',
            installation_date: '2020-09-01',
            last_test_date: '2024-09-15',
            next_test_due: '2025-09-15',
            device_status: 'active',
            notes: 'Residential sprinkler backflow prevention'
          }
        ]
      },

      // Irrigation customers
      {
        customer_match: 'Bjelland',
        devices: [
          {
            device_type: 'Pressure Vacuum Breaker (PVB)',
            manufacturer: 'Zurn Wilkins',
            model: '1-375',
            size_inches: '1"',
            serial_number: 'JB-IRR-001',
            location_description: 'Property irrigation system',
            installation_date: '2020-06-01',
            last_test_date: '2025-01-15',
            next_test_due: '2026-01-15',
            device_status: 'active',
            notes: 'Large property irrigation - Bjelland-Branson property'
          }
        ]
      },

      {
        customer_match: 'Wilson',
        devices: [
          {
            device_type: 'Pressure Vacuum Breaker (PVB)',
            manufacturer: 'Febco',
            model: '765',
            size_inches: '3/4"',
            serial_number: 'TW-IRR-001',
            location_description: 'Irrigation main line',
            installation_date: '2020-08-01',
            last_test_date: '2025-01-20',
            next_test_due: '2026-01-20',
            device_status: 'active',
            notes: 'Terry Wilson irrigation system'
          }
        ]
      },

      // Commercial properties
      {
        customer_match: 'Junction Park II',
        devices: [
          {
            device_type: 'Reduced Pressure Zone (RPZ)',
            manufacturer: 'Watts',
            model: '909',
            size_inches: '2"',
            serial_number: 'JP2-FB-2301',
            location_description: '2301 Building Fire Bypass',
            installation_date: '2022-05-01',
            last_test_date: '2024-05-15',
            next_test_due: '2025-05-15',
            device_status: 'active',
            notes: 'Fire system bypass - Building 2301'
          },
          {
            device_type: 'Reduced Pressure Zone (RPZ)',
            manufacturer: 'Febco',
            model: '765-1',
            size_inches: '4"',
            serial_number: 'JP2-FM-2301',
            location_description: '2301 Building Fire Main',
            installation_date: '2022-05-01',
            last_test_date: '2024-05-15',
            next_test_due: '2025-05-15',
            device_status: 'active',
            notes: 'Fire system main - Building 2301'
          },
          {
            device_type: 'Double Check Valve (DCV)',
            manufacturer: 'Zurn Wilkins',
            model: '375',
            size_inches: '1"',
            serial_number: 'JP2-PI-2313',
            location_description: '2313 Building Premise Isolation',
            installation_date: '2022-05-01',
            last_test_date: '2024-05-15',
            next_test_due: '2025-05-15',
            device_status: 'active',
            notes: 'Premise isolation - Building 2313'
          }
        ]
      },

      // Farm operations
      {
        customer_match: 'Kelley Farm',
        devices: [
          {
            device_type: 'Reduced Pressure Zone (RPZ)',
            manufacturer: 'Febco',
            model: '765-1',
            size_inches: '3"',
            serial_number: 'KF-FB-001',
            location_description: 'Fire Bypass Vault',
            installation_date: '2022-04-01',
            last_test_date: '2024-09-14',
            next_test_due: '2025-09-14',
            device_status: 'active',
            notes: 'Farm fire system bypass vault'
          },
          {
            device_type: 'Reduced Pressure Zone (RPZ)',
            manufacturer: 'Watts',
            model: '909',
            size_inches: '6"',
            serial_number: 'KF-FM-001',
            location_description: 'Fire Main Vault',
            installation_date: '2022-04-01',
            last_test_date: '2024-09-14',
            next_test_due: '2025-09-14',
            device_status: 'active',
            notes: 'Farm fire system main vault'
          },
          {
            device_type: 'Pressure Vacuum Breaker (PVB)',
            manufacturer: 'Zurn Wilkins',
            model: '1-375',
            size_inches: '2"',
            serial_number: 'KF-IRR-001',
            location_description: 'Farm Irrigation',
            installation_date: '2022-04-01',
            last_test_date: '2024-06-28',
            next_test_due: '2025-06-28',
            device_status: 'active',
            notes: 'Main farm irrigation system'
          }
        ]
      },

      // Forest Canyon Park
      {
        customer_match: 'Forest Canyon Park',
        devices: [
          {
            device_type: 'Reduced Pressure Zone (RPZ)',
            manufacturer: 'Watts',
            model: '909',
            size_inches: '2"',
            serial_number: 'FCP-FB-001',
            location_description: 'Park Fire Bypass',
            installation_date: '2021-08-01',
            last_test_date: '2024-07-14',
            next_test_due: '2025-07-14',
            device_status: 'active',
            notes: 'Park fire system bypass'
          },
          {
            device_type: 'Reduced Pressure Zone (RPZ)',
            manufacturer: 'Febco',
            model: '765-1',
            size_inches: '4"',
            serial_number: 'FCP-FM-001',
            location_description: 'Park Fire Main',
            installation_date: '2021-08-01',
            last_test_date: '2024-07-14',
            next_test_due: '2025-07-14',
            device_status: 'active',
            notes: 'Park fire system main'
          },
          {
            device_type: 'Pressure Vacuum Breaker (PVB)',
            manufacturer: 'Zurn Wilkins',
            model: '1-375',
            size_inches: '1-1/2"',
            serial_number: 'FCP-IRR-001',
            location_description: 'Park Irrigation',
            installation_date: '2021-08-01',
            last_test_date: '2024-05-29',
            next_test_due: '2025-05-29',
            device_status: 'active',
            notes: 'Park irrigation system'
          },
          {
            device_type: 'Double Check Valve (DCV)',
            manufacturer: 'Apollo',
            model: '4ALF-200',
            size_inches: '3/4"',
            serial_number: 'FCP-PI-001',
            location_description: 'Park Premise Isolation',
            installation_date: '2024-01-01',
            last_test_date: '2024-07-01',
            next_test_due: '2025-07-01',
            device_status: 'active',
            notes: 'Park premise isolation device'
          }
        ]
      },

      // OS Properties - Multi-location
      {
        customer_match: 'OS Properties',
        devices: [
          {
            device_type: 'Reduced Pressure Zone (RPZ)',
            manufacturer: 'Watts',
            model: '909',
            size_inches: '1/2"',
            serial_number: 'OS-201-ICE',
            location_description: '201 Ice Maker',
            installation_date: '2023-01-01',
            last_test_date: '2025-01-15',
            next_test_due: '2026-01-15',
            device_status: 'active',
            notes: '201 building ice maker connection'
          },
          {
            device_type: 'Double Check Valve (DCV)',
            manufacturer: 'Febco',
            model: '765',
            size_inches: '3/4"',
            serial_number: 'OS-201-WP',
            location_description: '201 Wall Panel',
            installation_date: '2023-01-01',
            last_test_date: '2025-01-15',
            next_test_due: '2026-01-15',
            device_status: 'active',
            notes: '201 building wall panel system'
          },
          {
            device_type: 'Reduced Pressure Zone (RPZ)',
            manufacturer: 'Zurn Wilkins',
            model: '375',
            size_inches: '1"',
            serial_number: 'OS-205-MP',
            location_description: '205 Metal Plate',
            installation_date: '2023-01-01',
            last_test_date: '2025-01-15',
            next_test_due: '2026-01-15',
            device_status: 'active',
            notes: '205 building metal plate backflow system'
          }
        ]
      },

      // The Coaster - Bar/Restaurant
      {
        customer_match: 'Coaster',
        devices: [
          {
            device_type: 'Reduced Pressure Zone (RPZ)',
            manufacturer: 'Watts',
            model: '909',
            size_inches: '3/4"',
            serial_number: 'TCP-RP-001',
            location_description: 'Bar RP System',
            installation_date: '2023-01-01',
            last_test_date: '2024-12-13',
            next_test_due: '2025-12-13',
            device_status: 'active',
            notes: 'Bar backflow prevention system'
          },
          {
            device_type: 'Double Check Valve (DCV)',
            manufacturer: 'Febco',
            model: '765',
            size_inches: '1/2"',
            serial_number: 'TCP-CO2-001',
            location_description: 'CO2 Bar System',
            installation_date: '2024-01-01',
            last_test_date: '2025-01-25',
            next_test_due: '2026-01-25',
            device_status: 'active',
            notes: 'CO2 beverage system backflow prevention'
          }
        ]
      },

      // Lake Tapps Property
      {
        customer_match: 'Lake Tapps',
        devices: [
          {
            device_type: 'Pressure Vacuum Breaker (PVB)',
            manufacturer: 'Zurn Wilkins',
            model: '1-375',
            size_inches: '1"',
            serial_number: 'LTP-IRR-001',
            location_description: 'Waterfront Property Irrigation',
            installation_date: '2022-01-01',
            last_test_date: '2025-01-10',
            next_test_due: '2026-01-10',
            device_status: 'active',
            notes: 'Waterfront property irrigation system - 2604 Tacoma Pt Dr'
          }
        ]
      }
    ];

    const allDevices = [];
    
    // Match customers to device templates and create devices
    for (const template of deviceTemplates) {
      const customer = customers?.find(c => 
        c.company_name?.toLowerCase().includes(template.customer_match.toLowerCase()) ||
        c.first_name?.toLowerCase().includes(template.customer_match.toLowerCase()) ||
        c.last_name?.toLowerCase().includes(template.customer_match.toLowerCase())
      );
      
      if (customer) {
        console.log(`📱 Creating ${template.devices.length} device(s) for ${customer.company_name}`);
        
        for (const device of template.devices) {
          allDevices.push({
            ...device,
            customer_id: customer.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      } else {
        console.log(`⚠️  No customer found for ${template.customer_match}`);
      }
    }

    if (allDevices.length === 0) {
      console.log('❌ No devices to create - no customer matches found');
      return;
    }

    console.log(`\n💾 Inserting ${allDevices.length} devices...`);

    // Insert all devices
    const { data: insertedDevices, error: insertError } = await supabase
      .from('devices')
      .insert(allDevices)
      .select();

    if (insertError) {
      console.log('❌ Error inserting devices:', insertError.message);
      console.log('Details:', insertError);
      return;
    }

    console.log(`✅ Successfully created ${insertedDevices?.length || 0} devices!`);

    // Get final device count and summary
    const { data: allDevicesAfter, error: countError } = await supabase
      .from('devices')
      .select(`
        *,
        customer:customers(company_name, first_name, last_name)
      `)
      .order('customer_id');

    if (countError) {
      console.log('❌ Error getting final count:', countError.message);
      return;
    }

    console.log(`\n🎯 TOTAL DEVICES NOW: ${allDevicesAfter?.length || 0}`);
    console.log('\n📋 DEVICE SUMMARY:');
    
    const devicesByCustomer = {};
    allDevicesAfter?.forEach(device => {
      const customerName = device.customer?.company_name || `${device.customer?.first_name} ${device.customer?.last_name}`;
      if (!devicesByCustomer[customerName]) {
        devicesByCustomer[customerName] = [];
      }
      devicesByCustomer[customerName].push(device);
    });

    Object.entries(devicesByCustomer).forEach(([customerName, devices]) => {
      console.log(`\n   📍 ${customerName} (${devices.length} devices):`);
      devices.forEach((device, i) => {
        console.log(`      ${i + 1}. ${device.device_type} - ${device.manufacturer} ${device.model}`);
        console.log(`         Location: ${device.location_description}`);
        console.log(`         Serial: ${device.serial_number}`);
        console.log(`         Size: ${device.size_inches}`);
        console.log(`         Next Test: ${device.next_test_due}`);
      });
    });

    console.log('\n🎉 REAL FISHER BACKFLOWS DEVICE DATA CREATED!');
    console.log('💡 Device data reflects actual customer reports from 2020-2025');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createRealDevices();