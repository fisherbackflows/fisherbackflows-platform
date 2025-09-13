'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Droplet,
  Search,
  Filter,
  MapPin,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Settings,
  Edit,
  Eye,
  Users,
  MoreVertical,
  Plus,
  Wrench
} from 'lucide-react'

interface Device {
  id: string
  customer_name: string
  customer_id: string
  manufacturer: string
  model: string
  size_inches: string
  serial_number: string
  location_description: string
  device_status: 'active' | 'needs_service' | 'decommissioned'
  last_test_date?: string
  next_test_due?: string
  installation_date?: string
  device_type: string
  test_status: 'current' | 'overdue' | 'upcoming'
}

export default function TesterPortalDevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [testStatusFilter, setTestStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchDevices()
  }, [])

  useEffect(() => {
    filterDevices()
  }, [searchTerm, statusFilter, testStatusFilter, devices])

  const fetchDevices = async () => {
    try {
      // Mock data - will be replaced with real API
      const mockDevices: Device[] = [
        {
          id: '1',
          customer_name: 'ABC Manufacturing',
          customer_id: '1',
          manufacturer: 'Febco',
          model: '860',
          size_inches: '3/4',
          serial_number: 'FB860-2024-001',
          location_description: 'Main Building - Basement Utility Room',
          device_status: 'active',
          last_test_date: '2024-09-15',
          next_test_due: '2025-09-15',
          installation_date: '2023-03-10',
          device_type: 'Double Check Valve',
          test_status: 'current'
        },
        {
          id: '2',
          customer_name: 'Green Valley School District',
          customer_id: '2',
          manufacturer: 'Watts',
          model: '909',
          size_inches: '1',
          serial_number: 'WT909-2023-045',
          location_description: 'Cafeteria Kitchen - Near Dishwasher',
          device_status: 'needs_service',
          last_test_date: '2024-08-20',
          next_test_due: '2024-12-30',
          installation_date: '2022-06-15',
          device_type: 'Reduced Pressure Zone',
          test_status: 'overdue'
        },
        {
          id: '3',
          customer_name: 'Metro Apartments',
          customer_id: '3',
          manufacturer: 'Zurn Wilkins',
          model: '350XL',
          size_inches: '2',
          serial_number: 'ZW350-2024-089',
          location_description: 'Building A - Mechanical Room',
          device_status: 'active',
          last_test_date: '2024-10-05',
          next_test_due: '2025-10-05',
          installation_date: '2024-01-20',
          device_type: 'Double Check Valve',
          test_status: 'current'
        },
        {
          id: '4',
          customer_name: 'Metro Apartments',
          customer_id: '3',
          manufacturer: 'Apollo',
          model: '4A-206',
          size_inches: '1.5',
          serial_number: 'AP206-2023-122',
          location_description: 'Building B - Fire System Connection',
          device_status: 'active',
          last_test_date: '2024-11-01',
          next_test_due: '2025-01-15',
          installation_date: '2023-11-12',
          device_type: 'Reduced Pressure Zone',
          test_status: 'upcoming'
        }
      ]

      setDevices(mockDevices)
    } catch (error) {
      console.error('Failed to fetch devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterDevices = () => {
    let filtered = devices

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(device =>
        device.customer_name.toLowerCase().includes(term) ||
        device.manufacturer.toLowerCase().includes(term) ||
        device.model.toLowerCase().includes(term) ||
        device.serial_number.toLowerCase().includes(term) ||
        device.location_description.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(device => device.device_status === statusFilter)
    }

    if (testStatusFilter !== 'all') {
      filtered = filtered.filter(device => device.test_status === testStatusFilter)
    }

    setFilteredDevices(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20'
      case 'needs_service': return 'text-yellow-400 bg-yellow-400/20'
      case 'decommissioned': return 'text-red-400 bg-red-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'text-green-400 bg-green-400/20'
      case 'upcoming': return 'text-blue-400 bg-blue-400/20'
      case 'overdue': return 'text-red-400 bg-red-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'needs_service': return <Wrench className="h-4 w-4" />
      case 'decommissioned': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading devices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900">
      {/* Header */}
      <header className="border-b border-cyan-400/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/tester-portal/dashboard/crm" className="text-cyan-400 hover:text-white">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-3">
                <Droplet className="h-8 w-8 text-cyan-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Device Management</h1>
                  <p className="text-cyan-400">{filteredDevices.length} devices</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-cyan-400/20">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400" />
              <input
                type="text"
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="all" className="bg-slate-800">All Status</option>
                <option value="active" className="bg-slate-800">Active</option>
                <option value="needs_service" className="bg-slate-800">Needs Service</option>
                <option value="decommissioned" className="bg-slate-800">Decommissioned</option>
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400" />
              <select
                value={testStatusFilter}
                onChange={(e) => setTestStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="all" className="bg-slate-800">All Tests</option>
                <option value="current" className="bg-slate-800">Current</option>
                <option value="upcoming" className="bg-slate-800">Upcoming</option>
                <option value="overdue" className="bg-slate-800">Overdue</option>
              </select>
            </div>

            <div className="flex items-center text-white/80">
              <Droplet className="h-5 w-5 text-cyan-400 mr-2" />
              <span className="text-sm">Total: {filteredDevices.length} devices</span>
            </div>
          </div>
        </div>

        {/* Devices Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.map((device) => (
            <div 
              key={device.id}
              className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 hover:scale-105 transition-all duration-200"
            >
              {/* Device Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {device.manufacturer} {device.model}
                  </h3>
                  <p className="text-cyan-300 text-sm">{device.size_inches}" {device.device_type}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(device.device_status)}`}>
                      {getStatusIcon(device.device_status)}
                      <span className="capitalize">{device.device_status.replace('_', ' ')}</span>
                    </div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTestStatusColor(device.test_status)}`}>
                      <span className="capitalize">{device.test_status}</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <MoreVertical className="h-4 w-4 text-white/60" />
                  </button>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-2 mb-4">
                <Link 
                  href={`/tester-portal/customers/${device.customer_id}`}
                  className="flex items-center text-cyan-300 text-sm hover:text-white transition-colors"
                >
                  <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{device.customer_name}</span>
                </Link>
                <div className="flex items-center text-cyan-300 text-sm">
                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{device.location_description}</span>
                </div>
                <div className="flex items-center text-cyan-300 text-sm">
                  <Settings className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">SN: {device.serial_number}</span>
                </div>
              </div>

              {/* Test Dates */}
              <div className="space-y-2 mb-4">
                {device.last_test_date && (
                  <div className="flex items-center text-white/80 text-sm">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Last: {new Date(device.last_test_date).toLocaleDateString()}</span>
                  </div>
                )}
                {device.next_test_due && (
                  <div className="flex items-center text-white/80 text-sm">
                    <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Due: {new Date(device.next_test_due).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Link
                  href={`/tester-portal/devices/${device.id}`}
                  className="flex-1 py-2 bg-cyan-600/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-600/30 hover:text-white rounded-lg text-sm transition-all flex items-center justify-center space-x-1"
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </Link>
                <Link
                  href={`/tester-portal/schedule/new?device=${device.id}`}
                  className="flex-1 py-2 bg-green-600/20 border border-green-400/30 text-green-300 hover:bg-green-600/30 hover:text-white rounded-lg text-sm transition-all flex items-center justify-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Test</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredDevices.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto">
              <Droplet className="h-16 w-16 text-cyan-400/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Devices Found</h3>
              <p className="text-white/80 mb-4">
                {searchTerm || statusFilter !== 'all' || testStatusFilter !== 'all' 
                  ? 'Try adjusting your search or filters.'
                  : 'No devices have been registered yet.'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}