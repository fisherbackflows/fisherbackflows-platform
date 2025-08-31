'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle,
  User,
  Calendar,
  Database,
  Eye,
  Clock,
  FileText,
  RefreshCw,
  TrendingUp,
  Activity,
  ArrowLeft,
  X
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AuditEvent {
  id: string;
  timestamp: string;
  event_type: string;
  user_id?: string;
  user_email?: string;
  entity_type?: string;
  entity_id?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  ip_address?: string;
  metadata: Record<string, any>;
  regulations: string[];
  error_message?: string;
}

interface AuditStats {
  totalEvents: number;
  eventsByAction: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  failureRate: number;
  topUsers: { user_email: string; count: number }[];
}

export default function AuditLogViewer() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    severity: '',
    eventType: '',
    user: '',
    startDate: '',
    endDate: '',
    success: '',
    regulation: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const severityColors = {
    low: 'text-blue-800 bg-blue-200 border-blue-200',
    medium: 'text-amber-700 bg-amber-50 border-amber-200',
    high: 'text-orange-700 bg-orange-50 border-orange-200',
    critical: 'text-red-700 bg-red-200 border-red-200'
  };

  const eventTypeIcons: Record<string, any> = {
    'auth': User,
    'customer': Database,
    'payment': FileText,
    'system': Activity,
    'admin': Shield,
    'security': AlertTriangle
  };

  useEffect(() => {
    loadAuditLogs();
    loadAuditStats();
  }, [filters, currentPage]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      const response = await fetch(`/api/admin/audit-logs?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEvents(data.events || []);
          setTotalPages(Math.ceil((data.total || 0) / 50));
        } else {
          setEvents([]);
          setTotalPages(1);
        }
      } else {
        // API doesn't exist yet - show empty state
        setEvents([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditStats = async () => {
    try {
      const response = await fetch('/api/admin/audit-stats?timeframe=week');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats || null);
        } else {
          setStats(null);
        }
      } else {
        // API doesn't exist yet
        setStats(null);
      }
    } catch (error) {
      console.error('Failed to load audit stats:', error);
    }
  };

  const exportLogs = async (format: 'json' | 'csv' | 'xml') => {
    try {
      const response = await fetch('/api/admin/audit-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          filters,
          startDate: filters.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: filters.endDate || new Date().toISOString()
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
    setShowExportModal(false);
  };

  const getEventTypeIcon = (eventType: string) => {
    const category = eventType.split('.')[0];
    const IconComponent = eventTypeIcons[category] || Activity;
    return IconComponent;
  };

  const formatEventType = (eventType: string) => {
    return eventType.replace(/[._]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      severity: '',
      eventType: '',
      user: '',
      startDate: '',
      endDate: '',
      success: '',
      regulation: ''
    });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-400">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Professional Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button className="bg-slate-300 hover:bg-slate-400 text-slate-700 p-2 rounded-lg">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="p-3 bg-blue-200 rounded-lg">
                <Shield className="w-6 h-6 text-blue-800" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Audit Logs</h1>
                <p className="text-slate-800 mt-1">Security and compliance monitoring</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowExportModal(true)}
                className="bg-slate-300 hover:bg-slate-400 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              
              <Button
                onClick={() => { loadAuditLogs(); loadAuditStats(); }}
                className="bg-blue-700 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Professional Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center hover:shadow-md transition-shadow duration-200">
              <div className="text-2xl font-bold text-slate-900">{stats.totalEvents.toLocaleString()}</div>
              <div className="text-sm text-slate-800 mt-1">Total Events</div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center hover:shadow-md transition-shadow duration-200">
              <div className="text-2xl font-bold text-red-800">
                {stats.eventsBySeverity?.critical || 0}
              </div>
              <div className="text-sm text-slate-800 mt-1">Critical Events</div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center hover:shadow-md transition-shadow duration-200">
              <div className="text-2xl font-bold text-amber-600">{stats.failureRate.toFixed(1)}%</div>
              <div className="text-sm text-slate-800 mt-1">Failure Rate</div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center hover:shadow-md transition-shadow duration-200">
              <div className="text-2xl font-bold text-emerald-600">{stats.topUsers.length}</div>
              <div className="text-sm text-slate-800 mt-1">Active Users</div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center hover:shadow-md transition-shadow duration-200">
              <div className="text-2xl font-bold text-blue-800">
                {Object.keys(stats.eventsByAction).length}
              </div>
              <div className="text-sm text-slate-800 mt-1">Event Types</div>
            </div>
          </div>
        )}

        {/* Professional Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-400 rounded-lg">
              <Filter className="w-5 h-5 text-slate-800" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
            {Object.values(filters).some(v => v !== '') && (
              <button
                onClick={resetFilters}
                className="ml-auto text-sm text-slate-700 hover:text-slate-700 transition-colors font-medium"
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 w-4 h-4" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search events..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors duration-200"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Event Type</label>
              <input
                type="text"
                value={filters.eventType}
                onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
                placeholder="e.g., auth.login"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">User</label>
              <input
                type="text"
                value={filters.user}
                onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
                placeholder="User email or ID"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={filters.success}
                onChange={(e) => setFilters(prev => ({ ...prev, success: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors duration-200"
              >
                <option value="">All Statuses</option>
                <option value="true">Success</option>
                <option value="false">Failure</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Regulation</label>
              <select
                value={filters.regulation}
                onChange={(e) => setFilters(prev => ({ ...prev, regulation: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors duration-200"
              >
                <option value="">All Regulations</option>
                <option value="GDPR">GDPR</option>
                <option value="CCPA">CCPA</option>
                <option value="SOC2">SOC2</option>
                <option value="PCI_DSS">PCI DSS</option>
              </select>
            </div>
          </div>
        </div>

        {/* Professional Events List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Audit Events</h2>
            {events.length === 0 && !loading && (
              <p className="text-sm text-slate-800 mt-1">No audit events available yet</p>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <LoadingSpinner size="lg" />
              <p className="text-slate-800 mt-4">Loading audit events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-16 h-16 text-slate-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Audit Events</h3>
              <p className="text-slate-800 mb-6">Audit events will appear here when user activity and system events are logged.</p>
              <div className="space-y-2 text-sm text-slate-700">
                <p>• User authentication events</p>
                <p>• Data access and modifications</p>
                <p>• Administrative actions</p>
                <p>• Security-related activities</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-400">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {events.map((event) => {
                      const IconComponent = getEventTypeIcon(event.event_type);
                      return (
                        <tr key={event.id} className="hover:bg-slate-400 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="p-2 bg-slate-300 rounded-lg mr-3">
                                <IconComponent className="w-4 h-4 text-blue-800" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-900">
                                  {formatEventType(event.event_type)}
                                </div>
                                {event.entity_type && (
                                  <div className="text-xs text-slate-700">
                                    {event.entity_type}: {event.entity_id?.substring(0, 8)}...
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900">
                              {event.user_email || event.user_id || 'System'}
                            </div>
                            {event.ip_address && (
                              <div className="text-xs text-slate-700">{event.ip_address}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${severityColors[event.severity]}`}>
                              {event.severity.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${
                              event.success 
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                                : 'text-red-700 bg-red-200 border-red-200'
                            }`}>
                              {event.success ? 'Success' : 'Failure'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                            {new Date(event.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => setSelectedEvent(event)}
                              className="text-blue-800 hover:text-blue-800 transition-colors p-1 rounded-md hover:bg-blue-200"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Professional Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-slate-400 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-sm text-slate-800">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white hover:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-300 rounded-lg text-sm text-slate-700 transition-colors duration-200"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white hover:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-300 rounded-lg text-sm text-slate-700 transition-colors duration-200"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
              <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Event Details</h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-800 hover:text-white"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-800">Event Type</label>
                    <p className="text-white">{formatEventType(selectedEvent.event_type)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-800">Timestamp</label>
                    <p className="text-white">{new Date(selectedEvent.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-800">User</label>
                    <p className="text-white">{selectedEvent.user_email || 'System'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-800">IP Address</label>
                    <p className="text-white">{selectedEvent.ip_address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-800">Severity</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[selectedEvent.severity]}`}>
                      {selectedEvent.severity.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm text-gray-800">Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedEvent.success 
                        ? 'text-green-400 bg-green-700/20' 
                        : 'text-red-400 bg-red-500/20'
                    }`}>
                      {selectedEvent.success ? 'Success' : 'Failure'}
                    </span>
                  </div>
                </div>

                {selectedEvent.error_message && (
                  <div>
                    <label className="text-sm text-gray-800">Error Message</label>
                    <p className="text-red-400 bg-red-500/10 p-3 rounded-lg">
                      {selectedEvent.error_message}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-800">Regulations</label>
                  <div className="flex gap-2 mt-1">
                    {selectedEvent.regulations.map(reg => (
                      <span key={reg} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                        {reg}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-800">Metadata</label>
                  <pre className="text-sm text-gray-300 bg-gray-800 p-3 rounded-lg overflow-auto">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Export Audit Logs</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-gray-800">Choose export format:</p>
                
                <div className="space-y-2">
                  <button
                    onClick={() => exportLogs('json')}
                    className="w-full p-3 text-left bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
                  >
                    <div className="text-white font-medium">JSON</div>
                    <div className="text-sm text-gray-800">Machine-readable format</div>
                  </button>
                  
                  <button
                    onClick={() => exportLogs('csv')}
                    className="w-full p-3 text-left bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
                  >
                    <div className="text-white font-medium">CSV</div>
                    <div className="text-sm text-gray-800">Spreadsheet compatible</div>
                  </button>
                  
                  <button
                    onClick={() => exportLogs('xml')}
                    className="w-full p-3 text-left bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
                  >
                    <div className="text-white font-medium">XML</div>
                    <div className="text-sm text-gray-800">Structured document format</div>
                  </button>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}