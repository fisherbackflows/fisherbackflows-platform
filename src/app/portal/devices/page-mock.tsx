'use client';

import { useState, useEffect } from 'react';
import { 
  Droplet, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  MapPin, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Download,
  Eye,
  Search,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/Logo';
import Link from 'next/link';
import DeviceForm from '@/components/devices/DeviceForm';

// Mock device data - in production, this would come from Supabase
const mockDevices = [
  {
    id: 'dev1',
    location: '123 Main St - Front Yard',
    address: '123 Main St, Tacoma, WA 98401',
    serialNumber: 'BF-2023-001',
    size: '3/4"',
    make: 'Watts',
    model: 'Series 909',
    type: 'Reduced Pressure Zone',
    installDate: '2023-01-15',
    lastTestDate: '2024-01-15',
    nextTestDate: '2025-01-15',
    status: 'Passed',
    daysUntilTest: 45,
    testingRequired: true,
    notes: 'Located near main water meter',
    photos: ['device1_front.jpg', 'device1_tags.jpg']
  },
  {
    id: 'dev2',
    location: '123 Main St - Backyard',
    address: '123 Main St, Tacoma, WA 98401',
    serialNumber: 'BF-2023-002',
    size: '1"',
    make: 'Febco',
    model: '860',
    type: 'Double Check Valve',
    installDate: '2023-03-20',
    lastTestDate: '2024-03-20',
    nextTestDate: '2025-03-20',
    status: 'Due Soon',
    daysUntilTest: 15,
    testingRequired: true,
    notes: 'Irrigation system connection',
    photos: ['device2_front.jpg']
  },
  {
    id: 'dev3',
    location: '456 Oak Ave - Basement',
    address: '456 Oak Ave, Tacoma, WA 98402',
    serialNumber: 'BF-2024-003',
    size: '2"',
    make: 'Zurn Wilkins',
    model: '350',
    type: 'Reduced Pressure Zone',
    installDate: '2024-06-10',
    lastTestDate: '2024-06-10',
    nextTestDate: '2025-06-10',
    status: 'Passed',
    daysUntilTest: 180,
    testingRequired: true,
    notes: 'Commercial building main line',
    photos: ['device3_front.jpg', 'device3_tags.jpg', 'device3_location.jpg']
  }
];

export default function DevicesPage() {
  const [devices, setDevices] = useState(mockDevices);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Passed': return 'text-green-400 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border-green-400/30';
      case 'Failed': return 'text-red-400 bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 border-red-400/30';
      case 'Due Soon': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'Overdue': return 'text-red-400 bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/30 border-red-400/40';
      default: return 'text-blue-400 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border-blue-400/30';
    }
  };

  const getDaysUntilTestColor = (days: number) => {
    if (days < 0) return 'text-red-400';
    if (days <= 7) return 'text-red-400';
    if (days <= 30) return 'text-yellow-400';
    return 'text-green-400';
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'due-soon' && device.daysUntilTest <= 30) ||
                         (filterStatus === 'passed' && device.status === 'Passed') ||
                         (filterStatus === 'failed' && device.status === 'Failed');

    return matchesSearch && matchesFilter;
  });

  const deviceStats = {
    total: devices.length,
    dueSoon: devices.filter(d => d.daysUntilTest <= 30).length,
    passed: devices.filter(d => d.status === 'Passed').length,
    failed: devices.filter(d => d.status === 'Failed').length
  };

  const handleSaveDevice = (deviceData: any) => {
    if (editingDevice) {
      // Update existing device
      setDevices(prev => prev.map(d => d.id === deviceData.id ? deviceData : d));
    } else {
      // Add new device
      setDevices(prev => [...prev, deviceData]);
    }
    setEditingDevice(null);
    setShowAddForm(false);
  };

  const handleEditDevice = (device: any) => {
    setEditingDevice(device);
    setShowAddForm(true);
  };

  const handleDeleteDevice = (deviceId: string) => {
    if (confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
      setDevices(prev => prev.filter(d => d.id !== deviceId));
    }
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingDevice(null);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/portal/dashboard">
                <Button className="glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white px-3 py-2 rounded-2xl">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Logo width={160} height={128} />
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => { setEditingDevice(null); setShowAddForm(true); }}
                className="glass-btn-primary hover:glow-blue text-white px-4 py-2 rounded-2xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
              <Button className="glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white px-4 py-2 rounded-2xl">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 ">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Backflow Device Management</h1>
          <p className="text-white/80">
            Manage all your backflow prevention devices and stay compliant with testing requirements.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass border border-blue-400 rounded-xl p-6 hover:glow-blue transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-2">
                <Droplet className="h-6 w-6 text-blue-400" />
              </div>
              <span className="text-2xl font-bold">{deviceStats.total}</span>
            </div>
            <h3 className="font-medium mb-1">Total Devices</h3>
            <p className="text-white/80 text-sm">All registered devices</p>
          </div>

          <div className="glass border border-blue-400 rounded-xl p-6 hover:glow-blue transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-2">
                <AlertTriangle className={`h-6 w-6 ${deviceStats.dueSoon > 0 ? 'text-yellow-400' : 'text-green-400'}`} />
              </div>
              <span className={`text-2xl font-bold ${deviceStats.dueSoon > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                {deviceStats.dueSoon}
              </span>
            </div>
            <h3 className="font-medium mb-1">Due Soon</h3>
            <p className="text-white/80 text-sm">Tests needed within 30 days</p>
          </div>

          <div className="glass border border-blue-400 rounded-xl p-6 hover:glow-blue transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-2">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <span className="text-2xl font-bold text-green-400">{deviceStats.passed}</span>
            </div>
            <h3 className="font-medium mb-1">Passed Tests</h3>
            <p className="text-white/80 text-sm">Current compliant devices</p>
          </div>

          <div className="glass border border-blue-400 rounded-xl p-6 hover:glow-blue transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-2">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              <span className="text-2xl font-bold">{deviceStats.failed}</span>
            </div>
            <h3 className="font-medium mb-1">Failed Tests</h3>
            <p className="text-white/80 text-sm">Devices needing attention</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="glass border border-blue-400 rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                type="text"
                placeholder="Search devices by location, serial number, make, or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/90 border border-blue-400 glass text-black w-full pl-10 pr-4 py-3 rounded-2xl placeholder-gray-500"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-white/80" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-blue-400 glass text-white px-4 py-3 rounded-2xl text-white bg-transparent"
                >
                  <option value="all" className="glass">All Devices</option>
                  <option value="due-soon" className="glass">Due Soon</option>
                  <option value="passed" className="glass">Passed</option>
                  <option value="failed" className="glass">Failed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Device List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDevices.map((device) => (
            <div key={device.id} className="glass border border-blue-400 rounded-2xl p-6 glow-blue-sm ">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-white mb-1">{device.location}</h3>
                  <p className="text-white/80 text-sm mb-2">{device.address}</p>
                  <div className="flex items-center space-x-4 text-sm text-white/70">
                    <span>{device.make} {device.model}</span>
                    <span>•</span>
                    <span>{device.size}</span>
                    <span>•</span>
                    <span>S/N: {device.serialNumber}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(device.status)}`}>
                  {device.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="glass border border-blue-400 rounded-2xl p-3">
                  <p className="text-white/50 mb-1">Device Type</p>
                  <p className="text-white/90 font-medium">{device.type}</p>
                </div>
                <div className="glass border border-blue-400 rounded-2xl p-3">
                  <p className="text-white/50 mb-1">Install Date</p>
                  <p className="text-white/90 font-medium">{new Date(device.installDate).toLocaleDateString()}</p>
                </div>
                <div className="glass border border-blue-400 rounded-2xl p-3">
                  <p className="text-white/50 mb-1">Last Test</p>
                  <p className="text-white/90 font-medium">{new Date(device.lastTestDate).toLocaleDateString()}</p>
                </div>
                <div className="glass border border-blue-400 rounded-2xl p-3">
                  <p className="text-white/50 mb-1">Next Test Due</p>
                  <p className="text-white/90 font-medium">{new Date(device.nextTestDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="text-sm">
                  <p className="text-white/50">Days Until Test</p>
                  <p className={`font-bold text-lg ${getDaysUntilTestColor(device.daysUntilTest)}`}>
                    {device.daysUntilTest} days
                    {device.daysUntilTest < 0 ? ' OVERDUE' : ''}
                  </p>
                </div>
                {device.photos.length > 0 && (
                  <div className="text-sm text-white/80">
                    {device.photos.length} photo{device.photos.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {device.notes && (
                <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-3 mb-4">
                  <p className="text-white/50 text-xs mb-1">Notes</p>
                  <p className="text-white/90 text-sm">{device.notes}</p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button className="flex-1 glass-btn-primary hover:glow-blue text-white py-2 rounded-2xl text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Test
                </Button>
                <Button className="glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white px-3 py-2 rounded-2xl">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => handleEditDevice(device)}
                  className="glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white px-3 py-2 rounded-2xl"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => handleDeleteDevice(device.id)}
                  className="glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white px-3 py-2 rounded-2xl hover:bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredDevices.length === 0 && (
          <div className="text-center py-12">
            <Droplet className="h-16 w-16 text-white/90 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white/80 mb-2">No devices found</h3>
            <p className="text-white/90 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first backflow device.'
              }
            </p>
            <Button 
              onClick={() => { setEditingDevice(null); setShowAddForm(true); }}
              className="glass-btn-primary hover:glow-blue text-white px-6 py-3 rounded-2xl"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add First Device
            </Button>
          </div>
        )}
      </div>

      {/* Device Form Modal */}
      <DeviceForm
        device={editingDevice}
        isOpen={showAddForm}
        onClose={closeForm}
        onSave={handleSaveDevice}
      />
    </div>
  );
}