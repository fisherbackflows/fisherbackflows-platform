# Customer Profile Management in Tester Portal

## Overview
The Fisher Backflows Tester Portal includes comprehensive customer profile management features for companies to manage their customer database.

## Available Features

### 1. Customer Dashboard (`/team-portal/customers`)
- **Customer List**: View all customers with status indicators
- **Search & Filter**: Find customers by name, email, or phone
- **Status Filtering**: Filter by current, due, overdue, or inactive status
- **Quick Stats**: See total customers, current, due soon, and overdue counts
- **Quick Actions**: Test, Schedule, Call buttons for each customer

### 2. Customer Profile Creation (`/team-portal/customers/new`)

#### Basic Information
- Customer/Business Name
- Email and Phone
- Customer Type (Residential, Commercial, Industrial)

#### Address Information  
- Street Address
- City, State, ZIP
- Water District selection

#### Device Management
- Add multiple backflow devices per customer
- Device types: RP, PVB, DC, DCDA, SVB
- Device details: Manufacturer, Model, Serial Number, Location, Size

#### Features
- **Auto-save**: Form data saved every 15 seconds
- **Keyboard shortcuts**: Ctrl+S to save, Esc to cancel
- **Data recovery**: Recover unsaved changes
- **Phone formatting**: Automatic phone number formatting

### 3. Customer Profile Management

#### Individual Customer Pages (`/team-portal/customers/[id]`)
- View detailed customer information
- Edit customer details
- Manage associated devices
- Track test history
- Schedule appointments

#### Bulk Operations
- Customer import functionality
- Export customer data
- Database management tools

## API Endpoints

### Customer CRUD Operations
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/[id]` - Get specific customer
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Team Portal Specific
- `GET /api/team/customers` - Get customers for team portal
- `POST /api/team/customers/import` - Bulk import customers

## Customer Data Structure

```typescript
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  customerType: 'residential' | 'commercial' | 'industrial';
  waterDistrict: string;
  lastTestDate: string | null;
  nextTestDue: string | null;
  status: 'current' | 'due' | 'overdue' | 'inactive';
  deviceCount: number;
  notes: string;
  devices: Device[];
}
```

## Device Management

Each customer can have multiple backflow prevention devices:

```typescript
interface Device {
  id: string;
  type: 'RP' | 'PVB' | 'DC' | 'DCDA' | 'SVB';
  manufacturer: string;
  model: string;
  serialNumber: string;
  location: string;
  installDate: string;
  size: string;
}
```

## Usage Instructions

### Creating a New Customer Profile

1. **Navigate to Customer Management**
   ```
   /team-portal/customers
   ```

2. **Click "Add Customer" Button**
   - Located in the header of the customer dashboard

3. **Fill Required Information**
   - Customer Name (required)
   - Phone (required)  
   - Street Address (required)
   - City (required)
   - ZIP (required)

4. **Add Optional Information**
   - Email address
   - Customer type
   - Water district
   - Notes

5. **Add Devices (Optional)**
   - Click "Add Device" to add backflow devices
   - Fill device details for each device
   - Multiple devices can be added per customer

6. **Save Customer**
   - Click "Save Customer" or press Ctrl+S
   - Customer will be created and redirected to customer list

### Managing Existing Customers

1. **View Customer List**
   - All customers displayed with key information
   - Status indicators show compliance status

2. **Search Customers**
   - Use search bar to find by name, email, or phone
   - Filter by status (current, due, overdue)

3. **Quick Actions**
   - **Test**: Create new test report for customer
   - **Schedule**: Schedule appointment  
   - **Call**: Direct phone link

4. **Edit Customer**
   - Click edit button to modify customer details
   - Update information and save changes

## Integration with Other Features

### Testing Workflow
- Select customer when creating new test reports
- Test results automatically update customer status
- Test history tracked per customer

### Scheduling  
- Schedule appointments directly from customer profile
- Customer information pre-populated in booking forms

### Reporting
- Generate customer-specific reports
- Track compliance status and test history

## Security & Authentication

- Team portal authentication required
- Role-based access (admin, technician, tester roles)
- Session validation for all operations
- Data validation and sanitization

## Database Schema

Customers are stored in the `customers` table with relationships to:
- `devices` table (one-to-many)
- `test_reports` table (one-to-many)  
- `appointments` table (one-to-many)
- `invoices` table (one-to-many)

## Mobile Optimization

- Responsive design for mobile devices
- Touch-friendly interface
- Optimized forms for mobile input
- Swipe gestures for navigation

## Current Status: ✅ Fully Functional

The customer profile management system is already built and ready to use. Companies can:

1. ✅ Create detailed customer profiles
2. ✅ Manage customer information and devices  
3. ✅ Search and filter customers
4. ✅ Track testing compliance status
5. ✅ Integrate with testing and scheduling workflows
6. ✅ Import/export customer data
7. ✅ Mobile-responsive interface