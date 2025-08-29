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
  Activity
} from 'lucide-react';

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
    low: 'text-blue-400 bg-blue-500/20',
    medium: 'text-yellow-400 bg-yellow-500/20',
    high: 'text-orange-400 bg-orange-500/20',
    critical: 'text-red-400 bg-red-500/20'
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
        setEvents(data.events);
        setTotalPages(Math.ceil(data.total / 50));
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
        setStats(data.stats);
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
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
                <p className="text-gray-400">Security and compliance monitoring</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              
              <button
                onClick={() => { loadAuditLogs(); loadAuditStats(); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.totalEvents.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Total Events</div>
            </div>
            
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-400">
                {Object.values(stats.eventsBySeverity).reduce((acc, count) => acc + count, 0)}
              </div>
              <div className="text-xs text-gray-400">Critical Events</div>
            </div>
            
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">{stats.failureRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-400">Failure Rate</div>
            </div>
            
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.topUsers.length}</div>
              <div className="text-xs text-gray-400">Active Users</div>
            </div>
            
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Object.keys(stats.eventsByAction).length}
              </div>
              <div className="text-xs text-gray-400">Event Types</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Filters</h2>
            {Object.values(filters).some(v => v !== '') && (
              <button
                onClick={resetFilters}
                className="ml-auto text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search events..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Event Type</label>
              <input
                type="text"
                value={filters.eventType}
                onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
                placeholder="e.g., auth.login"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">User</label>
              <input
                type="text"
                value={filters.user}
                onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
                placeholder="User email or ID"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filters.success}
                onChange={(e) => setFilters(prev => ({ ...prev, success: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
              >
                <option value="">All Statuses</option>
                <option value="true">Success</option>
                <option value="false">Failure</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Regulation</label>
              <select
                value={filters.regulation}
                onChange={(e) => setFilters(prev => ({ ...prev, regulation: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
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

        {/* Events List */}
        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Audit Events</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading audit events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No audit events found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {events.map((event) => {
                      const IconComponent = getEventTypeIcon(event.event_type);
                      return (
                        <tr key={event.id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="p-2 bg-gray-800 rounded-lg mr-3">
                                <IconComponent className="w-4 h-4 text-blue-400" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {formatEventType(event.event_type)}
                                </div>
                                {event.entity_type && (
                                  <div className="text-xs text-gray-400">
                                    {event.entity_type}: {event.entity_id?.substring(0, 8)}...
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">
                              {event.user_email || event.user_id || 'System'}
                            </div>
                            {event.ip_address && (
                              <div className="text-xs text-gray-400">{event.ip_address}</div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[event.severity]}`}>
                              {event.severity.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              event.success 
                                ? 'text-green-400 bg-green-500/20' 
                                : 'text-red-400 bg-red-500/20'
                            }`}>
                              {event.success ? 'Success' : 'Failure'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(event.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => setSelectedEvent(event)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 bg-gray-800/30 border-t border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm text-white transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm text-white transition-colors"
                    >
                      Next
                    </button>
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
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Event Type</label>
                    <p className="text-white">{formatEventType(selectedEvent.event_type)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Timestamp</label>
                    <p className="text-white">{new Date(selectedEvent.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">User</label>
                    <p className="text-white">{selectedEvent.user_email || 'System'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">IP Address</label>
                    <p className="text-white">{selectedEvent.ip_address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Severity</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[selectedEvent.severity]}`}>
                      {selectedEvent.severity.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedEvent.success 
                        ? 'text-green-400 bg-green-500/20' 
                        : 'text-red-400 bg-red-500/20'
                    }`}>
                      {selectedEvent.success ? 'Success' : 'Failure'}
                    </span>
                  </div>
                </div>

                {selectedEvent.error_message && (
                  <div>
                    <label className="text-sm text-gray-400">Error Message</label>
                    <p className="text-red-400 bg-red-500/10 p-3 rounded-lg">
                      {selectedEvent.error_message}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-400">Regulations</label>
                  <div className="flex gap-2 mt-1">
                    {selectedEvent.regulations.map(reg => (
                      <span key={reg} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                        {reg}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Metadata</label>
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
                <p className="text-gray-400">Choose export format:</p>
                
                <div className="space-y-2">
                  <button
                    onClick={() => exportLogs('json')}
                    className="w-full p-3 text-left bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
                  >
                    <div className="text-white font-medium">JSON</div>
                    <div className="text-sm text-gray-400">Machine-readable format</div>
                  </button>
                  
                  <button
                    onClick={() => exportLogs('csv')}
                    className="w-full p-3 text-left bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
                  >
                    <div className="text-white font-medium">CSV</div>
                    <div className="text-sm text-gray-400">Spreadsheet compatible</div>
                  </button>
                  
                  <button
                    onClick={() => exportLogs('xml')}
                    className="w-full p-3 text-left bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
                  >
                    <div className="text-white font-medium">XML</div>
                    <div className="text-sm text-gray-400">Structured document format</div>
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