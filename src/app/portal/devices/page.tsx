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
  Settings,
  Upload,
  FileText,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCustomerData } from '@/hooks/useCustomerData';
import { PortalNavigation } from '@/components/navigation/UnifiedNavigation';
import DistrictNoticeUpload from '@/components/upload/DistrictNoticeUpload';

export default function CustomerDevicesPage() {
  const { customer, loading, error } = useCustomerData();
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingDevice, setUploadingDevice] = useState(null);

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

      <PortalNavigation userInfo={{
        name: customer?.name,
        email: customer?.email,
        accountNumber: customer?.accountNumber
      }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">

        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-white">Your Devices</h1>
              <p className="text-white/90 text-base sm:text-lg">Manage your backflow prevention devices</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-blue-200 font-bold text-xl sm:text-2xl">{customer.devices.length}</p>
              <p className="text-white/60">Total Devices</p>
            </div>
          </div>
        </div>

        {/* Devices Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {customer.devices.map((device) => (
            <div key={device.id} className="glass rounded-2xl p-4 sm:p-6 border border-blue-400 hover:glow-blue-sm transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <Droplet className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-white truncate">{device.manufacturer || 'Unknown'} {device.model || ''}</h3>
                    <p className="text-white/60 text-sm">Size: {device.size_inches || device.size || 'N/A'}"</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {device.device_status === 'active' ? (
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-200" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-200" />
                  )}
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3 mb-4">
                <div className="flex items-center space-x-2 text-white/80">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                  <span className="text-sm truncate">{device.location_description || device.location || 'No location'}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-white/80">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                  <span className="text-sm truncate">Serial: {device.serial_number || device.serialNumber || 'N/A'}</span>
                </div>

                {(device.last_test_date || device.lastTestDate) && (
                  <div className="flex items-center space-x-2 text-white/80">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                    <span className="text-sm">Last Test: {new Date(device.last_test_date || device.lastTestDate).toLocaleDateString()}</span>
                  </div>
                )}

                {(device.next_test_due || device.nextTestDate) && (
                  <div className="flex items-center space-x-2 text-white/80">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                    <span className="text-sm">Next Test: {new Date(device.next_test_due || device.nextTestDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 sm:pt-4 border-t border-blue-400/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-white/60 text-xs">Status</p>
                    <p className={`text-sm font-bold ${
                      device.device_status === 'active' 
                        ? 'text-green-200' 
                        : 'text-yellow-200'
                    }`}>
                      {device.device_status === 'active' ? 'Active' : 'Needs Service'}
                    </p>
                  </div>
                  <Button
                    onClick={() => setSelectedDevice(device)}
                    className="btn-glass px-3 sm:px-4 py-2 rounded-2xl text-sm"
                  >
                    <span className="hidden sm:inline">View Details</span>
                    <span className="sm:hidden">Details</span>
                  </Button>
                </div>
                
                {/* Upload District Notice Button */}
                <Button
                  onClick={() => {
                    setUploadingDevice(device);
                    setShowUploadModal(true);
                  }}
                  className="w-full py-2 bg-blue-600/20 border border-blue-400/30 text-blue-300 hover:bg-blue-600/30 hover:text-white rounded-2xl text-sm transition-all flex items-center justify-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload District Notice</span>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Device Details Modal/Panel (simplified) */}
        {selectedDevice && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8 border border-blue-400 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Device Details</h2>
                <Button
                  onClick={() => setSelectedDevice(null)}
                  className="btn-glass p-2 rounded-2xl flex-shrink-0"
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-sm">Manufacturer</label>
                    <p className="text-white font-bold break-words">{selectedDevice.manufacturer || selectedDevice.make || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">Model</label>
                    <p className="text-white font-bold break-words">{selectedDevice.model || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">Size</label>
                    <p className="text-white font-bold">{selectedDevice.size_inches || selectedDevice.size || 'N/A'}"</p>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">Status</label>
                    <p className={`font-bold ${
                      selectedDevice.device_status === 'active' 
                        ? 'text-green-200' 
                        : 'text-yellow-200'
                    }`}>
                      {selectedDevice.device_status === 'active' ? 'Active' : 'Needs Service'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-white/60 text-sm">Location</label>
                  <p className="text-white break-words">{selectedDevice.location_description || selectedDevice.location || 'No location'}</p>
                </div>
                
                <div>
                  <label className="text-white/60 text-sm">Serial Number</label>
                  <p className="text-white font-mono break-all">{selectedDevice.serial_number || selectedDevice.serialNumber || 'N/A'}</p>
                </div>
                
                {selectedDevice.installDate && (
                  <div>
                    <label className="text-white/60 text-sm">Installation Date</label>
                    <p className="text-white">{new Date(selectedDevice.installDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4 sm:gap-0">
                <Button
                  onClick={() => setSelectedDevice(null)}
                  className="btn-glass px-4 sm:px-6 py-2 rounded-2xl order-last sm:order-first"
                >
                  Close
                </Button>
                <Link href="/portal/schedule">
                  <Button className="btn-glow px-4 sm:px-6 py-2 rounded-2xl">
                    <span className="hidden sm:inline">Schedule Test</span>
                    <span className="sm:hidden">Schedule</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Upload District Notice Modal */}
        {showUploadModal && uploadingDevice && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass rounded-2xl p-6 border border-blue-400 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Upload District Notice</h2>
                  <p className="text-white/80 text-sm mt-1">
                    {uploadingDevice.manufacturer || 'Unknown'} {uploadingDevice.model || ''} • {uploadingDevice.location_description || uploadingDevice.location || 'No location'}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadingDevice(null);
                  }}
                  className="btn-glass p-2 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <DistrictNoticeUpload
                deviceId={uploadingDevice.id}
                customerId={customer?.id}
                onUploadSuccess={(data) => {
                  console.log('Upload successful:', data);
                  // Optionally refresh device data or show success message
                  setTimeout(() => {
                    setShowUploadModal(false);
                    setUploadingDevice(null);
                  }, 2000);
                }}
                onUploadError={(error) => {
                  console.error('Upload error:', error);
                  // Error handling is already built into the component
                }}
                showPreview={true}
              />

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadingDevice(null);
                  }}
                  className="btn-glass px-6 py-2 rounded-2xl"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}