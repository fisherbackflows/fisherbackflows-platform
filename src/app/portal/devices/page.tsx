'use client';

import { useState } from 'react';
import { 
  Droplet, 
  Calendar, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCustomerData } from '@/hooks/useCustomerData';

export default function CustomerDevicesPage() {
  const { customer, loading, error } = useCustomerData();
  const [selectedDevice, setSelectedDevice] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Loading your devices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Devices</h2>
          <p className="text-white/80 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="btn-glow">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!customer || !customer.devices) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-white/80">No devices found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/80/5 via-transparent to-blue-500/80/5" />

      {/* Header */}
      <header className="glass border-b border-blue-400 sticky top-0 z-50 glow-blue-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-white">
                Fisher Backflows
              </Link>
              <nav className="hidden md:flex space-x-1">
                <Link href="/portal/dashboard" className="px-4 py-2 rounded-2xl text-white/90 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all font-medium">
                  Dashboard
                </Link>
                <Link href="/portal/devices" className="px-4 py-2 rounded-2xl glass-btn-primary text-white glow-blue-sm font-medium">
                  Devices
                </Link>
                <Link href="/portal/billing" className="px-4 py-2 rounded-2xl text-white/90 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all font-medium">
                  Billing
                </Link>
                <Link href="/portal/reports" className="px-4 py-2 rounded-2xl text-white/90 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all font-medium">
                  Reports
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="font-semibold text-white">{customer.name}</p>
                <p className="text-sm text-white/80">Account: {customer.accountNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">

      {/* Navigation Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm mb-6">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/portal/dashboard">
              <Button variant="ghost" className="text-blue-300 hover:text-white">
                ← Back to Dashboard
              </Button>
            </Link>
            <nav className="flex space-x-4">
              <Link href="/portal/billing">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Billing</Button>
              </Link>
              <Link href="/portal/devices">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Devices</Button>
              </Link>
              <Link href="/portal/reports">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Reports</Button>
              </Link>
              <Link href="/portal/schedule">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Schedule</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-white">Your Devices</h1>
              <p className="text-white/90 text-lg">Manage your backflow prevention devices</p>
            </div>
            <div className="text-right">
              <p className="text-blue-300 font-bold text-2xl">{customer.devices.length}</p>
              <p className="text-white/60">Total Devices</p>
            </div>
          </div>
        </div>

        {/* Devices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customer.devices.map((device) => (
            <div key={device.id} className="glass rounded-2xl p-6 border border-blue-400 hover:glow-blue-sm transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Droplet className="h-8 w-8 text-blue-400" />
                  <div>
                    <h3 className="text-lg font-bold text-white">{device.manufacturer || 'Unknown'} {device.model || ''}</h3>
                    <p className="text-white/60 text-sm">Size: {device.size_inches || device.size || 'N/A'}"</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {device.device_status === 'active' ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2 text-white/80">
                  <MapPin className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">{device.location_description || device.location || 'No location'}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-white/80">
                  <Settings className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">Serial: {device.serial_number || device.serialNumber || 'N/A'}</span>
                </div>

                {(device.last_test_date || device.lastTestDate) && (
                  <div className="flex items-center space-x-2 text-white/80">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <span className="text-sm">Last Test: {new Date(device.last_test_date || device.lastTestDate).toLocaleDateString()}</span>
                  </div>
                )}

                {(device.next_test_due || device.nextTestDate) && (
                  <div className="flex items-center space-x-2 text-white/80">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span className="text-sm">Next Test: {new Date(device.next_test_due || device.nextTestDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-blue-400/30">
                <div className="text-center">
                  <p className="text-white/60 text-xs">Status</p>
                  <p className={`text-sm font-bold ${
                    device.device_status === 'active' 
                      ? 'text-green-400' 
                      : 'text-yellow-400'
                  }`}>
                    {device.device_status === 'active' ? 'Active' : 'Needs Service'}
                  </p>
                </div>
                <Button
                  onClick={() => setSelectedDevice(device)}
                  className="btn-glass px-4 py-2 rounded-2xl text-sm"
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Device Details Modal/Panel (simplified) */}
        {selectedDevice && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass rounded-2xl p-8 border border-blue-400 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Device Details</h2>
                <Button
                  onClick={() => setSelectedDevice(null)}
                  className="btn-glass p-2 rounded-2xl"
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-sm">Manufacturer</label>
                    <p className="text-white font-bold">{selectedDevice.manufacturer || selectedDevice.make || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">Model</label>
                    <p className="text-white font-bold">{selectedDevice.model || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">Size</label>
                    <p className="text-white font-bold">{selectedDevice.size_inches || selectedDevice.size || 'N/A'}"</p>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">Status</label>
                    <p className={`font-bold ${
                      selectedDevice.device_status === 'active' 
                        ? 'text-green-400' 
                        : 'text-yellow-400'
                    }`}>
                      {selectedDevice.device_status === 'active' ? 'Active' : 'Needs Service'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-white/60 text-sm">Location</label>
                  <p className="text-white">{selectedDevice.location_description || selectedDevice.location || 'No location'}</p>
                </div>
                
                <div>
                  <label className="text-white/60 text-sm">Serial Number</label>
                  <p className="text-white font-mono">{selectedDevice.serial_number || selectedDevice.serialNumber || 'N/A'}</p>
                </div>
                
                {selectedDevice.installDate && (
                  <div>
                    <label className="text-white/60 text-sm">Installation Date</label>
                    <p className="text-white">{new Date(selectedDevice.installDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex justify-end space-x-4">
                <Button
                  onClick={() => setSelectedDevice(null)}
                  className="btn-glass px-6 py-2 rounded-2xl"
                >
                  Close
                </Button>
                <Link href="/portal/schedule">
                  <Button className="btn-glow px-6 py-2 rounded-2xl">
                    Schedule Test
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}