'use client'

import { useState } from 'react'
import { 
  Code, 
  Copy, 
  CheckCircle, 
  Key, 
  Users, 
  Calendar, 
  FileText, 
  CreditCard,
  Shield,
  Webhook,
  ChevronRight,
  ExternalLink
} from 'lucide-react'

export default function BackflowBuddyDocs() {
  const [copiedCode, setCopiedCode] = useState('')
  const [activeSection, setActiveSection] = useState('getting-started')

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const CodeBlock = ({ code, language = 'javascript', id }: { code: string, language?: string, id: string }) => (
    <div className="relative">
      <div className="bg-black/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
        <pre className="text-blue-300">{code}</pre>
      </div>
      <button
        onClick={() => copyToClipboard(code, id)}
        className="absolute top-2 right-2 p-2 glass-btn-primary glow-blue text-white rounded hover:glow-blue transition-colors"
      >
        {copiedCode === id ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  )

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: Code },
    { id: 'authentication', title: 'Authentication', icon: Key },
    { id: 'customers', title: 'Customers', icon: Users },
    { id: 'appointments', title: 'Appointments', icon: Calendar },
    { id: 'devices', title: 'Devices', icon: Shield },
    { id: 'reports', title: 'Reports', icon: FileText },
    { id: 'billing', title: 'Billing', icon: CreditCard },
    { id: 'webhooks', title: 'Webhooks', icon: Webhook }
  ]

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-blue-400/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Code className="h-8 w-8 text-blue-300" />
              <div>
                <h1 className="text-2xl font-bold text-white">Tester Portal API</h1>
                <p className="text-blue-300">Developer Documentation</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <a
                href="/tester-portal/dashboard"
                className="text-blue-300 hover:text-white transition-colors"
              >
                Dashboard
              </a>
              <a
                href="https://github.com/fisherbackflows/backflow-buddy-api"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 glass-btn-primary glow-blue text-white px-4 py-2 rounded-lg font-semibold hover:glow-blue transition-colors"
              >
                <span>GitHub</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="sticky top-8 space-y-2">
              {sections.map(({ id, title, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeSection === id
                      ? 'glass-btn-primary glow-blue text-white'
                      : 'text-blue-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="glass border border-blue-400 glow-blue-sm rounded-xl p-8">
              
              {/* Getting Started */}
              {activeSection === 'getting-started' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-4">Getting Started</h2>
                    <p className="text-white/80 text-lg mb-6">
                      Welcome to the Tester Portal API! This RESTful API allows you to integrate 
                      professional backflow testing management into your existing applications.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Base URL</h3>
                    <CodeBlock 
                      code="https://fisherbackflows.com/api/v1" 
                      id="base-url"
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Quick Example</h3>
                    <p className="text-white/80 mb-4">
                      Here's a simple example to get you started with fetching customers:
                    </p>
                    <CodeBlock 
                      code={`// Fetch customers
const response = await fetch('https://fisherbackflows.com/api/v1/customers', {
  headers: {
    'X-API-Key': 'your-api-key-here',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.data); // Array of customers`}
                      id="quick-example"
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Response Format</h3>
                    <p className="text-white/80 mb-4">
                      All API responses follow a consistent format:
                    </p>
                    <CodeBlock 
                      code={`{
  "data": [...], // The requested data
  "pagination": { // For paginated endpoints
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  },
  "message": "Success" // Optional success message
}`}
                      id="response-format"
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Error Handling</h3>
                    <p className="text-white/80 mb-4">
                      Errors are returned with appropriate HTTP status codes and descriptive messages:
                    </p>
                    <CodeBlock 
                      code={`{
  "error": "Invalid API key",
  "code": "UNAUTHORIZED",
  "details": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456"
  }
}`}
                      id="error-format"
                    />
                  </div>
                </div>
              )}

              {/* Authentication */}
              {activeSection === 'authentication' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-4">Authentication</h2>
                    <p className="text-white/80 text-lg mb-6">
                      The Tester Portal API uses API keys for authentication. Include your API key 
                      in the <code className="bg-black/30 px-2 py-1 rounded text-blue-300">X-API-Key</code> header 
                      with every request.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Getting Your API Key</h3>
                    <ol className="list-decimal list-inside text-white/80 space-y-2 mb-6">
                      <li>Log in to your <a href="/tester-portal/dashboard" className="text-blue-300 hover:text-blue-300">Tester Portal Dashboard</a></li>
                      <li>Navigate to the "API Keys" section</li>
                      <li>Click "Create Key" and give it a descriptive name</li>
                      <li>Copy your API key immediately (it won't be shown again)</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Using Your API Key</h3>
                    <CodeBlock 
                      code={`// JavaScript/Node.js
const response = await fetch('https://fisherbackflows.com/api/v1/customers', {
  headers: {
    'X-API-Key': 'bbapi_your_key_here',
    'Content-Type': 'application/json'
  }
});

// cURL
curl -H "X-API-Key: bbapi_your_key_here" \\
     -H "Content-Type: application/json" \\
     https://fisherbackflows.com/api/v1/customers

// PHP
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://fisherbackflows.com/api/v1/customers');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-Key: bbapi_your_key_here',
    'Content-Type: application/json'
]);
$response = curl_exec($ch);`}
                      id="auth-examples"
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Rate Limits</h3>
                    <p className="text-white/80 mb-4">
                      API keys have rate limits to ensure service quality:
                    </p>
                    <ul className="list-disc list-inside text-white/80 space-y-2">
                      <li><strong>Starter Plan:</strong> 1,000 requests per hour</li>
                      <li><strong>Professional Plan:</strong> 5,000 requests per hour</li>
                      <li><strong>Enterprise Plan:</strong> Unlimited requests</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Customers */}
              {activeSection === 'customers' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-4">Customers API</h2>
                    <p className="text-white/80 text-lg mb-6">
                      Manage your customer database with full CRUD operations.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">List Customers</h3>
                    <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4 mb-4">
                      <code className="text-green-400 font-mono">GET /api/v1/customers</code>
                    </div>
                    <CodeBlock 
                      code={`// List customers with pagination and filtering
const response = await fetch('https://fisherbackflows.com/api/v1/customers?page=1&limit=50&search=john&status=active', {
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);

// Response
{
  "data": [
    {
      "id": "cust_123456",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "(555) 123-4567",
      "address": "123 Main St",
      "city": "Seattle",
      "state": "WA",
      "zip_code": "98101",
      "is_active": true,
      "email_verified": true,
      "next_test_date": "2024-06-15",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}`}
                      id="list-customers"
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Create Customer</h3>
                    <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 mb-4">
                      <code className="text-blue-400 font-mono">POST /api/v1/customers</code>
                    </div>
                    <CodeBlock 
                      code={`// Create a new customer
const response = await fetch('https://fisherbackflows.com/api/v1/customers', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'jane@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    phone: '(555) 987-6543',
    address: '456 Oak Ave',
    city: 'Portland',
    state: 'OR',
    zip_code: '97201',
    send_welcome_email: true
  })
});

const data = await response.json();
console.log(data.data); // Created customer object`}
                      id="create-customer"
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Update Customer</h3>
                    <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4 mb-4">
                      <code className="text-yellow-400 font-mono">PATCH /api/v1/customers/:id</code>
                    </div>
                    <CodeBlock 
                      code={`// Update customer information
const response = await fetch('https://fisherbackflows.com/api/v1/customers/cust_123456', {
  method: 'PATCH',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: '(555) 111-2222',
    address: '789 New Street'
  })
});

const data = await response.json();
console.log(data.data); // Updated customer object`}
                      id="update-customer"
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Query Parameters</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border border-blue-400/20">
                        <thead className="glass-btn-primary glow-blue/20">
                          <tr>
                            <th className="px-4 py-2 text-white font-semibold">Parameter</th>
                            <th className="px-4 py-2 text-white font-semibold">Type</th>
                            <th className="px-4 py-2 text-white font-semibold">Description</th>
                          </tr>
                        </thead>
                        <tbody className="text-white/80">
                          <tr className="border-t border-blue-400/20">
                            <td className="px-4 py-2 font-mono">page</td>
                            <td className="px-4 py-2">integer</td>
                            <td className="px-4 py-2">Page number (default: 1)</td>
                          </tr>
                          <tr className="border-t border-blue-400/20">
                            <td className="px-4 py-2 font-mono">limit</td>
                            <td className="px-4 py-2">integer</td>
                            <td className="px-4 py-2">Items per page (default: 50, max: 100)</td>
                          </tr>
                          <tr className="border-t border-blue-400/20">
                            <td className="px-4 py-2 font-mono">search</td>
                            <td className="px-4 py-2">string</td>
                            <td className="px-4 py-2">Search in name or email</td>
                          </tr>
                          <tr className="border-t border-blue-400/20">
                            <td className="px-4 py-2 font-mono">status</td>
                            <td className="px-4 py-2">string</td>
                            <td className="px-4 py-2">Filter by status: 'active' or 'inactive'</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Appointments */}
              {activeSection === 'appointments' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-4">Appointments API</h2>
                    <p className="text-white/80 text-lg mb-6">
                      Manage appointment scheduling, updates, and cancellations.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">List Appointments</h3>
                    <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4 mb-4">
                      <code className="text-green-400 font-mono">GET /api/v1/appointments</code>
                    </div>
                    <CodeBlock 
                      code={`// List appointments with filtering
const response = await fetch('https://fisherbackflows.com/api/v1/appointments?status=scheduled&date_from=2024-01-01', {
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);

// Response
{
  "data": [
    {
      "id": "appt_123456",
      "customer_id": "cust_123456",
      "customer": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "(555) 123-4567"
      },
      "scheduled_date": "2024-06-15",
      "time_slot": "09:00-11:00",
      "service_type": "Annual Test",
      "status": "scheduled",
      "technician_id": "tech_789",
      "notes": "Customer prefers morning appointments",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}`}
                      id="list-appointments"
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Create Appointment</h3>
                    <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 mb-4">
                      <code className="text-blue-400 font-mono">POST /api/v1/appointments</code>
                    </div>
                    <CodeBlock 
                      code={`// Schedule a new appointment
const response = await fetch('https://fisherbackflows.com/api/v1/appointments', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customer_id: 'cust_123456',
    scheduled_date: '2024-06-15',
    time_slot: '09:00-11:00',
    service_type: 'Annual Test',
    notes: 'First floor device only',
    send_confirmation: true
  })
});

const data = await response.json();
console.log(data.data); // Created appointment`}
                      id="create-appointment"
                    />
                  </div>
                </div>
              )}

              {/* Devices */}
              {activeSection === 'devices' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-4">Devices API</h2>
                    <p className="text-white/80 text-lg mb-6">
                      Manage backflow prevention devices and their testing history.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">List Devices</h3>
                    <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4 mb-4">
                      <code className="text-green-400 font-mono">GET /api/v1/devices</code>
                    </div>
                    <CodeBlock 
                      code={`// List customer devices
const response = await fetch('https://fisherbackflows.com/api/v1/devices?customer_id=cust_123456', {
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  }
});

// Response
{
  "data": [
    {
      "id": "device_123456",
      "customer_id": "cust_123456",
      "location": "Main Building - 1st Floor",
      "device_type": "Double Check Valve",
      "manufacturer": "Watts",
      "model": "009M1",
      "serial_number": "ABC123456",
      "installation_date": "2020-01-15",
      "last_test_date": "2023-06-15",
      "next_test_due": "2024-06-15",
      "status": "active",
      "compliance_status": "compliant"
    }
  ]
}`}
                      id="list-devices"
                    />
                  </div>
                </div>
              )}

              {/* Webhooks */}
              {activeSection === 'webhooks' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-4">Webhooks</h2>
                    <p className="text-white/80 text-lg mb-6">
                      Receive real-time notifications when events occur in your account.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Available Events</h3>
                    <ul className="list-disc list-inside text-white/80 space-y-2 mb-6">
                      <li><code className="bg-black/30 px-2 py-1 rounded text-blue-300">customer.created</code> - New customer added</li>
                      <li><code className="bg-black/30 px-2 py-1 rounded text-blue-300">customer.updated</code> - Customer information changed</li>
                      <li><code className="bg-black/30 px-2 py-1 rounded text-blue-300">appointment.scheduled</code> - New appointment created</li>
                      <li><code className="bg-black/30 px-2 py-1 rounded text-blue-300">appointment.completed</code> - Appointment marked as completed</li>
                      <li><code className="bg-black/30 px-2 py-1 rounded text-blue-300">test.completed</code> - Device test completed</li>
                      <li><code className="bg-black/30 px-2 py-1 rounded text-blue-300">invoice.created</code> - New invoice generated</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Webhook Payload Example</h3>
                    <CodeBlock 
                      code={`{
  "event": "customer.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "customer": {
      "id": "cust_123456",
      "email": "new-customer@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "created_at": "2024-01-15T10:30:00Z"
    }
  },
  "webhook_id": "wh_789012"
}`}
                      id="webhook-payload"
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Verifying Webhooks</h3>
                    <p className="text-white/80 mb-4">
                      Verify webhook authenticity using the signature in the <code className="bg-black/30 px-2 py-1 rounded text-blue-300">X-Signature</code> header:
                    </p>
                    <CodeBlock 
                      code={`// Node.js webhook verification
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === 'sha256=' + expectedSignature;
}

// Express.js webhook handler
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-signature'];
  const isValid = verifyWebhook(req.body, signature, 'your-webhook-secret');
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = JSON.parse(req.body);
  console.log('Received event:', event.event);
  
  res.status(200).send('OK');
});`}
                      id="webhook-verification"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}