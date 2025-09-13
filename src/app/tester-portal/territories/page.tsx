'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  MapPinIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisHorizontalIcon,
  BuildingOfficeIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { 
  MapPinIcon as MapPinIconSolid 
} from '@heroicons/react/24/solid'

interface Territory {
  id: string
  name: string
  description: string
  manager: string
  technicians: Array<{
    id: string
    name: string
    status: 'available' | 'busy' | 'offline'
  }>
  boundaries: {
    north: string
    south: string
    east: string
    west: string
  }
  stats: {
    customers: number
    active_jobs: number
    monthly_revenue: number
    completion_rate: number
    avg_response_time: number
  }
  performance: {
    efficiency: number
    customer_satisfaction: number
    growth_rate: number
  }
  zones: Array<{
    id: string
    name: string
    priority: 'low' | 'medium' | 'high'
    customer_count: number
    status: 'optimal' | 'overloaded' | 'underutilized'
  }>
}

interface Assignment {
  id: string
  technician_name: string
  customer_name: string
  service_type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  scheduled_time: string
  estimated_duration: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  territory_id: string
  location: {
    address: string
    coordinates: { lat: number; lng: number }
  }
}

interface Route {
  id: string
  technician: string
  territory_id: string
  assignments: string[]
  total_distance: string
  estimated_time: string
  efficiency_score: number
  status: 'planned' | 'active' | 'completed'
  created_at: string
}

const mockTerritories: Territory[] = [
  {
    id: '1',
    name: 'North Metro District',
    description: 'Commercial and residential properties in the northern metropolitan area',
    manager: 'Sarah Johnson',
    technicians: [
      { id: '1', name: 'Mike Chen', status: 'busy' },
      { id: '2', name: 'David Kim', status: 'available' },
      { id: '3', name: 'Robert Wilson', status: 'busy' }
    ],
    boundaries: {
      north: '45th Street N',
      south: 'Downtown Core',
      east: 'Highway 101',
      west: 'River Boulevard'
    },
    stats: {
      customers: 892,
      active_jobs: 47,
      monthly_revenue: 298500,
      completion_rate: 94.2,
      avg_response_time: 2.4
    },
    performance: {
      efficiency: 89.5,
      customer_satisfaction: 4.7,
      growth_rate: 18.3
    },
    zones: [
      { id: '1a', name: 'Business District North', priority: 'high', customer_count: 234, status: 'optimal' },
      { id: '1b', name: 'Residential Hills', priority: 'medium', customer_count: 445, status: 'optimal' },
      { id: '1c', name: 'Industrial Park', priority: 'high', customer_count: 213, status: 'overloaded' }
    ]
  },
  {
    id: '2',
    name: 'South Central District',
    description: 'High-density commercial corridor with mixed-use developments',
    manager: 'Emily Rodriguez',
    technicians: [
      { id: '4', name: 'Lisa Park', status: 'available' },
      { id: '5', name: 'James Martinez', status: 'busy' }
    ],
    boundaries: {
      north: 'Downtown Core',
      south: 'City Limits South',
      east: 'Central Avenue',
      west: 'Industrial Way'
    },
    stats: {
      customers: 701,
      active_jobs: 34,
      monthly_revenue: 234000,
      completion_rate: 91.7,
      avg_response_time: 3.1
    },
    performance: {
      efficiency: 85.2,
      customer_satisfaction: 4.5,
      growth_rate: 12.7
    },
    zones: [
      { id: '2a', name: 'Financial District', priority: 'high', customer_count: 187, status: 'optimal' },
      { id: '2b', name: 'Shopping Centers', priority: 'medium', customer_count: 298, status: 'underutilized' },
      { id: '2c', name: 'Transit Hub', priority: 'high', customer_count: 216, status: 'optimal' }
    ]
  },
  {
    id: '3',
    name: 'East Valley Territory',
    description: 'Expanding residential and commercial areas with new developments',
    manager: 'Tom Anderson',
    technicians: [
      { id: '6', name: 'Sarah Wong', status: 'available' },
      { id: '7', name: 'Kevin Brown', status: 'offline' },
      { id: '8', name: 'Maria Garcia', status: 'busy' }
    ],
    boundaries: {
      north: 'Valley Ridge',
      south: 'Mountain View',
      east: 'City Boundary East',
      west: 'Highway 101'
    },
    stats: {
      customers: 634,
      active_jobs: 28,
      monthly_revenue: 189000,
      completion_rate: 96.1,
      avg_response_time: 2.8
    },
    performance: {
      efficiency: 92.3,
      customer_satisfaction: 4.8,
      growth_rate: 28.1
    },
    zones: [
      { id: '3a', name: 'New Developments', priority: 'medium', customer_count: 267, status: 'optimal' },
      { id: '3b', name: 'Established Neighborhoods', priority: 'low', customer_count: 234, status: 'underutilized' },
      { id: '3c', name: 'Commercial Strip', priority: 'medium', customer_count: 133, status: 'optimal' }
    ]
  }
]

const mockAssignments: Assignment[] = [
  {
    id: '1',
    technician_name: 'Mike Chen',
    customer_name: 'Metro Plaza Shopping Center',
    service_type: 'Annual Testing',
    priority: 'high',
    scheduled_time: '2024-01-15T09:00:00',
    estimated_duration: '3 hours',
    status: 'in_progress',
    territory_id: '1',
    location: {
      address: '1234 Metro Plaza Drive',
      coordinates: { lat: 47.6062, lng: -122.3321 }
    }
  },
  {
    id: '2',
    technician_name: 'David Kim',
    customer_name: 'Riverside Apartments',
    service_type: 'Emergency Repair',
    priority: 'critical',
    scheduled_time: '2024-01-15T13:00:00',
    estimated_duration: '2 hours',
    status: 'scheduled',
    territory_id: '1',
    location: {
      address: '5678 Riverside Avenue',
      coordinates: { lat: 47.6205, lng: -122.3493 }
    }
  },
  {
    id: '3',
    technician_name: 'Lisa Park',
    customer_name: 'Downtown Office Complex',
    service_type: 'Routine Maintenance',
    priority: 'medium',
    scheduled_time: '2024-01-15T10:30:00',
    estimated_duration: '1.5 hours',
    status: 'scheduled',
    territory_id: '2',
    location: {
      address: '999 Financial Street',
      coordinates: { lat: 47.6038, lng: -122.3301 }
    }
  }
]

const mockRoutes: Route[] = [
  {
    id: '1',
    technician: 'Mike Chen',
    territory_id: '1',
    assignments: ['1', '4', '7'],
    total_distance: '47.3 miles',
    estimated_time: '6.5 hours',
    efficiency_score: 87,
    status: 'active',
    created_at: '2024-01-15T08:00:00'
  },
  {
    id: '2',
    technician: 'Lisa Park',
    territory_id: '2',
    assignments: ['3', '5'],
    total_distance: '23.1 miles',
    estimated_time: '4 hours',
    efficiency_score: 92,
    status: 'planned',
    created_at: '2024-01-15T07:30:00'
  }
]

export default function TerritoryManagement() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: amount > 999999 ? 'compact' : 'standard'
    }).format(amount)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30'
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'busy': return 'bg-orange-500'
      case 'offline': return 'bg-gray-500'
      case 'optimal': return 'text-green-400 bg-green-500/20'
      case 'overloaded': return 'text-red-400 bg-red-500/20'
      case 'underutilized': return 'text-yellow-400 bg-yellow-500/20'
      case 'scheduled': return 'text-blue-400 bg-blue-500/20'
      case 'in_progress': return 'text-yellow-400 bg-yellow-500/20'
      case 'completed': return 'text-green-400 bg-green-500/20'
      case 'cancelled': return 'text-red-400 bg-red-500/20'
      case 'active': return 'text-green-400 bg-green-500/20'
      case 'planned': return 'text-blue-400 bg-blue-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const filteredTerritories = mockTerritories.filter(territory =>
    territory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    territory.manager.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              href="/tester-portal/dashboard/crm"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
            >
              <ArrowLeftIcon className="h-5 w-5 text-white" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <MapPinIcon className="h-8 w-8 mr-3 text-green-400" />
                Territory Management
              </h1>
              <p className="text-blue-200 mt-1">Enterprise territory optimization and resource allocation</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" />
              <input
                type="text"
                placeholder="Search territories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
              />
            </div>
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              New Territory
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-1 mb-8 w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: MapPinIcon },
            { id: 'assignments', label: 'Assignments', icon: ClockIcon },
            { id: 'routes', label: 'Route Optimization', icon: TruckIcon },
            { id: 'analytics', label: 'Analytics', icon: ChartBarIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Territory Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Total Territories</h3>
                <p className="text-3xl font-bold text-green-400">{mockTerritories.length}</p>
                <p className="text-blue-200 text-sm mt-2">Active regions</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Total Customers</h3>
                <p className="text-3xl font-bold text-blue-400">
                  {mockTerritories.reduce((sum, t) => sum + t.stats.customers, 0).toLocaleString()}
                </p>
                <p className="text-blue-200 text-sm mt-2">Across all territories</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Monthly Revenue</h3>
                <p className="text-3xl font-bold text-purple-400">
                  {formatCurrency(mockTerritories.reduce((sum, t) => sum + t.stats.monthly_revenue, 0))}
                </p>
                <p className="text-blue-200 text-sm mt-2">Combined territories</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Active Jobs</h3>
                <p className="text-3xl font-bold text-yellow-400">
                  {mockTerritories.reduce((sum, t) => sum + t.stats.active_jobs, 0)}
                </p>
                <p className="text-blue-200 text-sm mt-2">Currently in progress</p>
              </div>
            </div>

            {/* Territory Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredTerritories.map((territory) => (
                <div key={territory.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{territory.name}</h3>
                      <p className="text-blue-200 mb-2">{territory.description}</p>
                      <p className="text-sm text-blue-300">Manager: {territory.manager}</p>
                    </div>
                    <button className="p-2 text-blue-300 hover:text-white">
                      <EllipsisHorizontalIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Territory Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 text-sm">Customers</p>
                          <p className="text-xl font-bold text-white">{territory.stats.customers.toLocaleString()}</p>
                        </div>
                        <UserGroupIcon className="h-8 w-8 text-blue-400" />
                      </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 text-sm">Revenue</p>
                          <p className="text-xl font-bold text-white">{formatCurrency(territory.stats.monthly_revenue)}</p>
                        </div>
                        <CurrencyDollarIcon className="h-8 w-8 text-green-400" />
                      </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 text-sm">Active Jobs</p>
                          <p className="text-xl font-bold text-white">{territory.stats.active_jobs}</p>
                        </div>
                        <ClockIcon className="h-8 w-8 text-yellow-400" />
                      </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 text-sm">Completion Rate</p>
                          <p className="text-xl font-bold text-white">{territory.stats.completion_rate}%</p>
                        </div>
                        <CheckCircleIcon className="h-8 w-8 text-green-400" />
                      </div>
                    </div>
                  </div>

                  {/* Technicians */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-3">Technicians ({territory.technicians.length})</h4>
                    <div className="space-y-2">
                      {territory.technicians.map((tech) => (
                        <div key={tech.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(tech.status)}`} />
                            <span className="text-white font-medium">{tech.name}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(tech.status)}`}>
                            {tech.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Zones */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-3">Zones ({territory.zones.length})</h4>
                    <div className="space-y-2">
                      {territory.zones.map((zone) => (
                        <div key={zone.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                          <div>
                            <p className="text-white font-medium">{zone.name}</p>
                            <p className="text-blue-200 text-sm">{zone.customer_count} customers</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(zone.priority)}`}>
                              {zone.priority.toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(zone.status)}`}>
                              {zone.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="p-4 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg border border-green-500/30">
                    <h4 className="text-lg font-semibold text-white mb-3">Performance Metrics</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-blue-200 mb-1">Efficiency</p>
                        <p className="text-xl font-bold text-white">{territory.performance.efficiency}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-blue-200 mb-1">Satisfaction</p>
                        <p className="text-xl font-bold text-white">{territory.performance.customer_satisfaction}/5.0</p>
                      </div>
                      <div className="text-center">
                        <p className="text-blue-200 mb-1">Growth</p>
                        <p className="text-xl font-bold text-white">+{territory.performance.growth_rate}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-6">
            {/* Assignment Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all" className="bg-slate-800">All Assignments</option>
                <option value="scheduled" className="bg-slate-800">Scheduled</option>
                <option value="in_progress" className="bg-slate-800">In Progress</option>
                <option value="completed" className="bg-slate-800">Completed</option>
              </select>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center">
                <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                Optimize Assignments
              </button>
            </div>

            {/* Assignment Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockAssignments.map((assignment) => (
                <div key={assignment.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{assignment.customer_name}</h3>
                      <p className="text-blue-200 text-sm mb-1">{assignment.service_type}</p>
                      <p className="text-blue-300 text-sm">{assignment.technician_name}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(assignment.priority)}`}>
                        {assignment.priority.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(assignment.status)}`}>
                        {assignment.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-200">Scheduled</span>
                      <span className="text-white">{new Date(assignment.scheduled_time).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-200">Duration</span>
                      <span className="text-white">{assignment.estimated_duration}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-200">Location</span>
                      <span className="text-white text-right">{assignment.location.address}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                      View Details
                    </button>
                    <button className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/20">
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'routes' && (
          <div className="space-y-6">
            {/* Route Optimization Header */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Route Optimization</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-2">Total Routes</h4>
                  <p className="text-3xl font-bold text-blue-400">{mockRoutes.length}</p>
                  <p className="text-blue-200 text-sm mt-1">Active today</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-2">Avg Efficiency</h4>
                  <p className="text-3xl font-bold text-green-400">
                    {Math.round(mockRoutes.reduce((sum, r) => sum + r.efficiency_score, 0) / mockRoutes.length)}%
                  </p>
                  <p className="text-blue-200 text-sm mt-1">Route optimization</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-2">Total Distance</h4>
                  <p className="text-3xl font-bold text-purple-400">
                    {mockRoutes.reduce((sum, r) => sum + parseFloat(r.total_distance), 0).toFixed(1)} mi
                  </p>
                  <p className="text-blue-200 text-sm mt-1">Combined routes</p>
                </div>
              </div>
            </div>

            {/* Route Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockRoutes.map((route) => (
                <div key={route.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{route.technician}</h3>
                      <p className="text-blue-200 text-sm">Route #{route.id}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(route.status)}`}>
                      {route.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-blue-200 text-sm">Assignments</p>
                      <p className="text-xl font-bold text-white">{route.assignments.length}</p>
                    </div>
                    <div>
                      <p className="text-blue-200 text-sm">Distance</p>
                      <p className="text-xl font-bold text-white">{route.total_distance}</p>
                    </div>
                    <div>
                      <p className="text-blue-200 text-sm">Est. Time</p>
                      <p className="text-xl font-bold text-white">{route.estimated_time}</p>
                    </div>
                    <div>
                      <p className="text-blue-200 text-sm">Efficiency</p>
                      <p className="text-xl font-bold text-white">{route.efficiency_score}%</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-blue-200">Route Efficiency</span>
                      <span className="text-white font-medium">{route.efficiency_score}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          route.efficiency_score >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                          route.efficiency_score >= 80 ? 'bg-gradient-to-r from-yellow-500 to-orange-600' :
                          'bg-gradient-to-r from-red-500 to-red-600'
                        }`}
                        style={{ width: `${route.efficiency_score}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                      <MapPinIconSolid className="h-4 w-4 mr-2" />
                      View Route
                    </button>
                    <button className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/20">
                      Optimize
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Territory Performance Comparison */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Territory Performance Comparison</h3>
              <div className="space-y-4">
                {mockTerritories.map((territory) => (
                  <div key={territory.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{territory.name}</h4>
                      <div className="text-right">
                        <p className="text-sm text-blue-200">Efficiency</p>
                        <p className="font-bold text-white">{territory.performance.efficiency}%</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-blue-200 mb-1">Revenue</p>
                        <p className="text-white font-medium">{formatCurrency(territory.stats.monthly_revenue)}</p>
                      </div>
                      <div>
                        <p className="text-blue-200 mb-1">Customers</p>
                        <p className="text-white font-medium">{territory.stats.customers}</p>
                      </div>
                      <div>
                        <p className="text-blue-200 mb-1">Growth</p>
                        <p className="text-white font-medium">+{territory.performance.growth_rate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resource Utilization */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Resource Utilization</h3>
              <div className="space-y-6">
                {mockTerritories.map((territory) => (
                  <div key={territory.id} className="space-y-3">
                    <h4 className="font-medium text-white">{territory.name}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-200">Available Technicians</span>
                        <span className="text-white">
                          {territory.technicians.filter(t => t.status === 'available').length} / {territory.technicians.length}
                        </span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-600 h-2 rounded-full"
                          style={{ 
                            width: `${(territory.technicians.filter(t => t.status === 'available').length / territory.technicians.length) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/30 mt-6">
                  <p className="text-white font-medium mb-2">Optimization Recommendations</p>
                  <ul className="text-blue-200 text-sm space-y-1">
                    <li>• North Metro Industrial Park is overloaded - consider adding 1 technician</li>
                    <li>• South Central Shopping Centers are underutilized - redistribute workload</li>
                    <li>• East Valley shows highest growth rate - plan for expansion</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}