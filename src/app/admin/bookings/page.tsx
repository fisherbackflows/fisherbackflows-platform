'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminProtection from '@/components/auth/AdminProtection';
import { AdminNavigation } from '@/components/navigation/UnifiedNavigation';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Search,
  Download,
  Eye,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import ErrorBoundary from '@/components/ErrorBoundary';
import toast, { Toaster } from 'react-hot-toast';

interface Booking {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  device_id: string;
  device_location: string;
  device_type: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  service_type: string;
  zone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  technician_name?: string;
}

interface BookingFilters {
  status: string;
  zone: string;
  dateRange: string;
  search: string;
}

interface BookingStats {
  total: number;
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  todayCount: number;
  weekCount: number;
}

function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    total: 0,
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    todayCount: 0,
    weekCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BookingFilters>({
    status: 'all',
    zone: 'all',
    dateRange: 'all',
    search: ''
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Booking;
    direction: 'asc' | 'desc';
  }>({
    key: 'scheduled_date',
    direction: 'desc'
  });

  const ITEMS_PER_PAGE = 10;

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/bookings');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.bookings || []);
        setStats(data.stats || stats);
      } else {
        throw new Error(data.error || 'Failed to load bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
      // Set empty state on error
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [stats]);

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    const loadingToast = toast.loading('Updating booking status...');
    
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      toast.success('Booking status updated successfully', { id: loadingToast });
      fetchBookings(); // Refresh data
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update booking status', { id: loadingToast });
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }

    const loadingToast = toast.loading('Deleting booking...');
    
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete booking');
      }

      toast.success('Booking deleted successfully', { id: loadingToast });
      fetchBookings(); // Refresh data
      setShowDetails(false);
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Failed to delete booking', { id: loadingToast });
    }
  };

  const exportBookings = async () => {
    try {
      const response = await fetch('/api/admin/bookings/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Bookings exported successfully');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export bookings');
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...bookings];

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(b => b.status === filters.status);
    }
    if (filters.zone !== 'all') {
      filtered = filtered.filter(b => b.zone === filters.zone);
    }
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const week = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.scheduled_date);
        if (filters.dateRange === 'today') {
          return bookingDate >= today && bookingDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        } else if (filters.dateRange === 'week') {
          return bookingDate >= week;
        }
        return true;
      });
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(b =>
        b.customer_name.toLowerCase().includes(search) ||
        b.customer_email.toLowerCase().includes(search) ||
        b.device_location.toLowerCase().includes(search) ||
        (b.customer_phone && b.customer_phone.includes(search))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [bookings, filters, sortConfig]);

  useEffect(() => {
    fetchBookings();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  const handleSort = (key: keyof Booking) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 border-blue-400 text-blue-300';
      case 'confirmed': return 'bg-green-500/20 border-green-400 text-green-300';
      case 'in_progress': return 'bg-yellow-500/20 border-yellow-400 text-yellow-300';
      case 'completed': return 'bg-emerald-500/20 border-emerald-400 text-emerald-300';
      case 'cancelled': return 'bg-red-500/20 border-red-400 text-red-300';
      case 'no_show': return 'bg-gray-500/20 border-gray-400 text-gray-300';
      default: return 'bg-gray-500/20 border-gray-400 text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      case 'no_show': return AlertTriangle;
      default: return Clock;
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  if (loading) {
    return (
      <AdminProtection requiredRole="admin">
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-white/80">Loading booking dashboard...</p>
          </div>
        </div>
      </AdminProtection>
    );
  }

  return (
    <ErrorBoundary>
      <AdminProtection requiredRole="admin">
        <div className="min-h-screen bg-black">
          <AdminNavigation userInfo={{ name: 'Admin', role: 'admin' }} />
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">Booking Management</h1>
                  <p className="text-white/90 text-xl">Manage customer appointments and scheduling</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={fetchBookings}
                    variant="outline"
                    size="sm"
                    className="border-blue-400 text-white/80 hover:glass"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    onClick={exportBookings}
                    variant="outline"
                    size="sm"
                    className="border-green-400 text-white/80 hover:glass"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              <div className="glass border border-blue-400 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-300 mb-1">{stats.total}</div>
                <div className="text-white/80 text-sm">Total Bookings</div>
              </div>
              <div className="glass border border-yellow-400 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-300 mb-1">{stats.scheduled}</div>
                <div className="text-white/80 text-sm">Scheduled</div>
              </div>
              <div className="glass border border-green-400 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-green-300 mb-1">{stats.confirmed}</div>
                <div className="text-white/80 text-sm">Confirmed</div>
              </div>
              <div className="glass border border-emerald-400 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-300 mb-1">{stats.completed}</div>
                <div className="text-white/80 text-sm">Completed</div>
              </div>
              <div className="glass border border-orange-400 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-orange-300 mb-1">{stats.todayCount}</div>
                <div className="text-white/80 text-sm">Today</div>
              </div>
              <div className="glass border border-purple-400 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-300 mb-1">{stats.weekCount}</div>
                <div className="text-white/80 text-sm">This Week</div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="glass border border-blue-400 rounded-2xl p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                  <input
                    type="text"
                    placeholder="Search customers, devices..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-blue-400"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="all">All Statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>

                {/* Zone Filter */}
                <select
                  value={filters.zone}
                  onChange={(e) => setFilters(prev => ({ ...prev, zone: e.target.value }))}
                  className="px-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="all">All Zones</option>
                  <option value="North Puyallup">North Puyallup</option>
                  <option value="South Puyallup">South Puyallup</option>
                </select>

                {/* Date Range Filter */}
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="px-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="glass border border-blue-400 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/50 border-b border-white/20">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-white font-semibold cursor-pointer hover:text-blue-300 transition-colors"
                        onClick={() => handleSort('customer_name')}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Customer</span>
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-white font-semibold cursor-pointer hover:text-blue-300 transition-colors"
                        onClick={() => handleSort('scheduled_date')}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Date & Time</span>
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Device</th>
                      <th 
                        className="px-6 py-4 text-left text-white font-semibold cursor-pointer hover:text-blue-300 transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Status</span>
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Zone</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {currentBookings.length > 0 ? (
                      currentBookings.map((booking) => {
                        const StatusIcon = getStatusIcon(booking.status);
                        const date = new Date(booking.scheduled_date);
                        const time = booking.scheduled_time;
                        
                        return (
                          <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-blue-300" />
                                </div>
                                <div>
                                  <div className="text-white font-medium">{booking.customer_name}</div>
                                  <div className="text-white/60 text-sm">{booking.customer_email}</div>
                                  {booking.customer_phone && (
                                    <div className="text-white/60 text-sm">{booking.customer_phone}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2 text-white">
                                <Calendar className="h-4 w-4 text-white/60" />
                                <div>
                                  <div>{date.toLocaleDateString()}</div>
                                  <div className="text-white/60 text-sm">{time}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-white/60" />
                                <div>
                                  <div className="text-white font-medium">{booking.device_type}</div>
                                  <div className="text-white/60 text-sm">{booking.device_location}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                                <StatusIcon className="h-3 w-3" />
                                <span className="capitalize">{booking.status.replace('_', ' ')}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-white/80">{booking.zone || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <Button
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setShowDetails(true);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="border-blue-400 text-blue-300 hover:glass"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteBooking(booking.id)}
                                  size="sm"
                                  variant="outline"
                                  className="border-red-400 text-red-300 hover:glass"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="text-white/60">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">No bookings found</p>
                            <p className="text-sm">
                              {filters.search || filters.status !== 'all' || filters.zone !== 'all' || filters.dateRange !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Bookings will appear here once customers start scheduling appointments'
                              }
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-white/20 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-white/60 text-sm">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white/60 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-white/80 text-sm">
                        {currentPage} of {totalPages}
                      </span>
                      <Button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white/60 disabled:opacity-50"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* Booking Details Modal */}
          {showDetails && selectedBooking && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="glass border border-blue-400 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-white/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Booking Details</h3>
                    <Button
                      onClick={() => setShowDetails(false)}
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white/60"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Customer Info */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Customer Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-white/60" />
                        <span className="text-white">{selectedBooking.customer_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-white/60" />
                        <span className="text-white/80">{selectedBooking.customer_email}</span>
                      </div>
                      {selectedBooking.customer_phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-white/60" />
                          <span className="text-white/80">{selectedBooking.customer_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Appointment Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-white/60" />
                        <span className="text-white">{new Date(selectedBooking.scheduled_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-white/60" />
                        <span className="text-white">{selectedBooking.scheduled_time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-white/60" />
                        <span className="text-white">{selectedBooking.zone || 'No zone specified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Device Details */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Device Information</h4>
                    <div className="space-y-2">
                      <div className="text-white">
                        <strong>Type:</strong> {selectedBooking.device_type}
                      </div>
                      <div className="text-white">
                        <strong>Location:</strong> {selectedBooking.device_location}
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Status & Actions</h4>
                    <div className="space-y-4">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedBooking.status)}`}>
                        {React.createElement(getStatusIcon(selectedBooking.status), { className: "h-4 w-4" })}
                        <span className="capitalize">{selectedBooking.status.replace('_', ' ')}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']
                          .filter(status => status !== selectedBooking.status)
                          .map(status => (
                            <Button
                              key={status}
                              onClick={() => handleStatusUpdate(selectedBooking.id, status)}
                              size="sm"
                              variant="outline"
                              className="border-blue-400 text-blue-300 hover:glass"
                            >
                              Mark as {status.replace('_', ' ')}
                            </Button>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedBooking.notes && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Notes</h4>
                      <p className="text-white/80 bg-black/30 p-3 rounded-lg">{selectedBooking.notes}</p>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Record Information</h4>
                    <div className="space-y-1 text-sm text-white/60">
                      <div>Created: {new Date(selectedBooking.created_at).toLocaleString()}</div>
                      <div>Updated: {new Date(selectedBooking.updated_at).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(15, 23, 42, 0.95)',
                color: '#fff',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }
            }}
          />
        </div>
      </AdminProtection>
    </ErrorBoundary>
  );
}

export default AdminBookings;