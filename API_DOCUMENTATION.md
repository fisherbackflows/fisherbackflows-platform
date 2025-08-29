# Fisher Backflows API Documentation

## Base URL
- **Development**: `http://localhost:3010/api`
- **Production**: `https://fisherbackflows.com/api`

## Authentication

The API uses two authentication methods:

### Customer Authentication
Uses session-based authentication with cookies.

```javascript
// Login
POST /api/auth/login
{
  "identifier": "email@example.com", // or phone number
  "password": "password123"
}

// Demo login
POST /api/auth/login
{
  "identifier": "demo",
  "type": "demo"
}
```

### Team Authentication
Uses token-based authentication with JWT.

```javascript
// Login
POST /api/team/auth/login
{
  "email": "admin@fisherbackflows.com",
  "password": "password"
}

// Returns
{
  "user": { ... },
  "token": "jwt-token-here"
}

// Use token in headers
Headers: {
  "Authorization": "Bearer jwt-token-here"
}
```

## Endpoints

### Health & Status

#### GET /api/health
Check API health status

**Response**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00Z",
  "version": "1.0.0"
}
```

#### GET /api/security/status
Get security metrics and status

**Response**
```json
{
  "rateLimiting": "enabled",
  "authentication": "configured",
  "encryption": "active"
}
```

### Customer Management

#### GET /api/customers
List all customers (requires admin auth)

**Query Parameters**
- `page` (number): Page number
- `limit` (number): Items per page
- `search` (string): Search term

**Response**
```json
{
  "customers": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-0123",
      "address": "123 Main St",
      "accountNumber": "FB001",
      "balance": 0,
      "status": "active"
    }
  ],
  "total": 127,
  "page": 1,
  "limit": 20
}
```

#### GET /api/customers/:id
Get customer details

**Response**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-0123",
  "address": "123 Main St",
  "accountNumber": "FB001",
  "devices": [
    {
      "id": "dev-uuid",
      "serialNumber": "BF-2023-001",
      "location": "Main Building",
      "size": "3/4\"",
      "make": "Watts",
      "model": "Series 909",
      "lastTestDate": "2024-01-15",
      "nextTestDate": "2025-01-15",
      "status": "passed"
    }
  ],
  "balance": 0,
  "status": "active"
}
```

#### POST /api/customers
Create new customer

**Request Body**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "555-0124",
  "address": "456 Oak Ave",
  "serviceAddress": {
    "street": "456 Oak Ave",
    "city": "Tacoma",
    "state": "WA",
    "zip": "98401"
  }
}
```

#### PUT /api/customers/:id
Update customer

**Request Body**
```json
{
  "name": "Jane Smith Updated",
  "email": "jane.new@example.com"
}
```

### Appointments

#### GET /api/appointments
List appointments

**Query Parameters**
- `date` (string): Filter by date (YYYY-MM-DD)
- `customerId` (string): Filter by customer
- `technicianId` (string): Filter by technician
- `status` (string): scheduled|completed|cancelled

**Response**
```json
{
  "appointments": [
    {
      "id": "apt-uuid",
      "customerId": "cust-uuid",
      "customerName": "John Doe",
      "scheduledDate": "2025-01-20",
      "scheduledTime": "09:00",
      "duration": 60,
      "status": "scheduled",
      "type": "annual_test",
      "notes": "Gate code: 1234"
    }
  ],
  "total": 8
}
```

#### POST /api/appointments
Create appointment

**Request Body**
```json
{
  "customerId": "cust-uuid",
  "scheduledDate": "2025-01-20",
  "scheduledTime": "09:00",
  "duration": 60,
  "type": "annual_test",
  "notes": "Customer prefers morning appointments"
}
```

#### GET /api/appointments/:id
Get appointment details

#### PUT /api/appointments/:id
Update appointment

#### DELETE /api/appointments/:id
Cancel appointment

### Calendar

#### GET /api/calendar/available-dates
Get available appointment dates

**Query Parameters**
- `month` (number): Month (1-12)
- `year` (number): Year

**Response**
```json
{
  "availableDates": [
    {
      "date": "2025-01-20",
      "slots": [
        { "time": "09:00", "available": true },
        { "time": "10:00", "available": true },
        { "time": "11:00", "available": false }
      ]
    }
  ]
}
```

### Test Reports

#### GET /api/test-reports
List test reports

**Query Parameters**
- `customerId` (string): Filter by customer
- `deviceId` (string): Filter by device
- `startDate` (string): Start date (YYYY-MM-DD)
- `endDate` (string): End date (YYYY-MM-DD)

**Response**
```json
{
  "reports": [
    {
      "id": "report-uuid",
      "testNumber": "2025-001",
      "customerId": "cust-uuid",
      "deviceId": "dev-uuid",
      "testDate": "2025-01-15",
      "result": "passed",
      "technicianId": "tech-uuid",
      "technicianName": "Mike Tech",
      "notes": "All checks passed"
    }
  ],
  "total": 23
}
```

#### POST /api/test-reports
Submit test report

**Request Body**
```json
{
  "customerId": "cust-uuid",
  "deviceId": "dev-uuid",
  "testDate": "2025-01-15",
  "result": "passed",
  "readings": {
    "linePressure": 65,
    "checkValve1": "passed",
    "checkValve2": "passed",
    "reliefValve": "passed"
  },
  "notes": "Annual test completed",
  "photos": ["photo-url-1", "photo-url-2"]
}
```

#### POST /api/test-reports/complete
Complete test with auto-invoicing

**Request Body**
```json
{
  "testReportId": "report-uuid",
  "generateInvoice": true,
  "invoiceAmount": 175.00,
  "sendEmail": true
}
```

### Invoices

#### GET /api/invoices
List invoices

**Query Parameters**
- `customerId` (string): Filter by customer
- `status` (string): draft|sent|paid|overdue
- `startDate` (string): Start date
- `endDate` (string): End date

**Response**
```json
{
  "invoices": [
    {
      "id": "inv-uuid",
      "invoiceNumber": "INV-2025-001",
      "customerId": "cust-uuid",
      "customerName": "John Doe",
      "date": "2025-01-15",
      "dueDate": "2025-02-15",
      "status": "sent",
      "subtotal": 175.00,
      "tax": 17.94,
      "total": 192.94,
      "lineItems": [
        {
          "description": "Annual Backflow Test",
          "quantity": 1,
          "unitPrice": 175.00,
          "amount": 175.00
        }
      ]
    }
  ],
  "total": 5
}
```

#### POST /api/invoices
Create invoice

**Request Body**
```json
{
  "customerId": "cust-uuid",
  "dueDate": "2025-02-15",
  "lineItems": [
    {
      "description": "Annual Backflow Test",
      "quantity": 1,
      "unitPrice": 175.00
    }
  ],
  "notes": "Thank you for your business",
  "sendEmail": true
}
```

#### GET /api/invoices/:id
Get invoice details

#### PUT /api/invoices/:id
Update invoice

#### POST /api/invoices/:id/send
Send invoice via email

#### POST /api/invoices/:id/mark-paid
Mark invoice as paid

### File Upload

#### POST /api/files/upload
Upload files (photos, documents)

**Request**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: FormData with file

**Response**
```json
{
  "url": "https://storage.supabase.co/...",
  "key": "uploads/2025/01/file.jpg",
  "size": 102400,
  "type": "image/jpeg"
}
```

### Admin Analytics

#### GET /api/admin/metrics
Get business metrics

**Response**
```json
{
  "success": true,
  "metrics": {
    "customers": {
      "total": 127,
      "active": 115,
      "needsService": 12
    },
    "appointments": {
      "scheduled": 8,
      "completed": 23,
      "pending": 2
    },
    "financials": {
      "monthlyRevenue": 34500,
      "pendingInvoices": 5,
      "overduePayments": 2
    }
  }
}
```

#### GET /api/admin/analytics
Get detailed analytics

**Query Parameters**
- `period` (string): day|week|month|year
- `startDate` (string): Start date
- `endDate` (string): End date

**Response**
```json
{
  "revenue": {
    "total": 34500,
    "growth": 18.5,
    "byMonth": [ ... ]
  },
  "tests": {
    "completed": 147,
    "passed": 142,
    "failed": 5,
    "completionRate": 96.6
  },
  "customers": {
    "new": 12,
    "churn": 2,
    "retention": 94.8
  }
}
```

#### GET /api/admin/activity
Get recent activity

**Query Parameters**
- `limit` (number): Number of activities

**Response**
```json
{
  "activities": [
    {
      "id": "act-1",
      "type": "test_completed",
      "icon": "CheckCircle",
      "text": "Test completed for John Doe",
      "time": "5 minutes ago",
      "color": "text-green-400"
    }
  ]
}
```

### Automation

#### GET /api/automation/orchestrator
Get automation status

**Query Parameters**
- `period` (number): Days to look back

**Response**
```json
{
  "success": true,
  "metrics": {
    "testsCompleted": 23,
    "invoicesGenerated": 23,
    "paymentsProcessed": 18,
    "reportsSubmitted": 23,
    "emailsSent": 47,
    "remindersScheduled": 12
  },
  "automationHealth": {
    "status": "healthy",
    "lastRun": "2025-01-15T10:00:00Z",
    "uptime": "99.8%"
  }
}
```

#### POST /api/automation/engine
Trigger automation cycle

**Request Body**
```json
{
  "action": "run_cycle",
  "type": "reminders|invoices|reports"
}
```

### Notifications

#### POST /api/notifications/send
Send notification

**Request Body**
```json
{
  "to": "customer@example.com",
  "type": "email|sms",
  "template": "test_reminder",
  "data": {
    "customerName": "John Doe",
    "testDate": "2025-01-20"
  }
}
```

#### POST /api/notifications/track
Track notification event

**Request Body**
```json
{
  "notificationId": "notif-uuid",
  "event": "delivered|opened|clicked",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Common Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

## Rate Limiting

- **Anonymous**: 60 requests per minute
- **Authenticated**: 300 requests per minute
- **Admin**: 600 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 1642345678
```

## Webhooks

### Stripe Webhook
**POST /api/stripe/webhook**

Handles Stripe payment events:
- `payment_intent.succeeded`
- `payment_intent.failed`
- `invoice.paid`
- `invoice.payment_failed`

## Best Practices

1. **Always use HTTPS in production**
2. **Include proper authentication headers**
3. **Handle rate limiting gracefully**
4. **Implement exponential backoff for retries**
5. **Validate all input data**
6. **Use pagination for large datasets**
7. **Cache responses when appropriate**

## SDK Examples

### JavaScript/TypeScript
```javascript
class FisherBackflowsAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://fisherbackflows.com/api';
  }

  async getCustomers(page = 1, limit = 20) {
    const response = await fetch(
      `${this.baseURL}/customers?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.json();
  }

  async createAppointment(data) {
    const response = await fetch(
      `${this.baseURL}/appointments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    );
    return response.json();
  }
}
```

### cURL Examples
```bash
# Get customers
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://fisherbackflows.com/api/customers

# Create appointment
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"customerId":"uuid","scheduledDate":"2025-01-20"}' \
  https://fisherbackflows.com/api/appointments
```

## Support

For API support or to request additional endpoints:
- Email: api@fisherbackflows.com
- Documentation: https://docs.fisherbackflows.com/api
- Status: https://status.fisherbackflows.com

---

*API Version 1.0 - Last Updated: January 2025*