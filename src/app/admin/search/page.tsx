import { Button } from '@/components/ui/button';
import Link from 'next/link';
'use client';

import { useState, useEffect } from 'react';
import SearchFilters from '@/components/common/SearchFilters';
import SearchResults from '@/components/common/SearchResults';
import { useSearchFilters, filterConfigurations } from '@/hooks/useSearchFilters';
import { Search, TrendingUp, Users, Calendar, FileText, Filter, Download } from 'lucide-react';

interface SearchStats {
  totalResults: number;
  customerCount: number;
  appointmentCount: number;
  invoiceCount: number;
  searchTime: number;
}

export default function AdminSearchPage() {
  const [searchType, setSearchType] = useState<'all' | 'customers' | 'appointments' | 'invoices'>('all');
  const [stats, setStats] = useState<SearchStats>({
    totalResults: 0,
    customerCount: 0,
    appointmentCount: 0,
    invoiceCount: 0,
    searchTime: 0
  });
  const [availableTechnicians, setAvailableTechnicians] = useState<{ label: string; value: string }[]>([]);

  // Custom search function that calls our API
  const performSearch = async (filters: any) => {
    const startTime = Date.now();
    
    try {
      const queryParams = new URLSearchParams({
        q: filters.query,
        type: searchType,
        ...(filters.dateRange.start && { start_date: filters.dateRange.start }),
        ...(filters.dateRange.end && { end_date: filters.dateRange.end }),
        ...(filters.status.length > 0 && { status: filters.status.join(',') }),
        ...(filters.serviceType.length > 0 && { service_type: filters.serviceType.join(',') }),
        ...(filters.location && { location: filters.location }),
        ...(filters.technician && { technician: filters.technician }),
        ...(filters.amountRange.min > 0 && { min_amount: filters.amountRange.min.toString() }),
        ...(filters.amountRange.max > 0 && { max_amount: filters.amountRange.max.toString() })
      });

      const response = await fetch(`/api/search?${queryParams}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      const searchTime = Date.now() - startTime;

      // Update stats
      if (searchType === 'all') {
        setStats({
          totalResults: data.data.length,
          customerCount: data.breakdown?.customers || 0,
          appointmentCount: data.breakdown?.appointments || 0,
          invoiceCount: data.breakdown?.invoices || 0,
          searchTime
        });
      } else {
        setStats(prev => ({
          ...prev,
          totalResults: data.data.length,
          searchTime
        }));
      }

      return data.data;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  };

  const {
    filters,
    results,
    loading,
    error,
    setFilters,
    pagination,
    hasResults,
    hasFilters
  } = useSearchFilters({
    searchFunction: performSearch,
    debounceMs: 400
  });

  // Load available technicians on mount
  useEffect(() => {
    const loadTechnicians = async () => {
      try {
        const response = await fetch('/api/team/members');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAvailableTechnicians(
              data.members.map((member: any) => ({
                label: member.name,
                value: member.team_member_id
              }))
            );
          }
        }
      } catch (error) {
        console.error('Failed to load technicians:', error);
      }
    };

    loadTechnicians();
  }, []);

  // Get appropriate filter configuration based on search type
  const getFilterConfig = () => {
    switch (searchType) {
      case 'customers':
        return filterConfigurations.customers;
      case 'appointments':
        return filterConfigurations.appointments;
      case 'invoices':
        return {
          ...filterConfigurations.invoices,
          availableServiceTypes: []
        };
      default:
        return {
          availableStatuses: [
            ...filterConfigurations.customers.availableStatuses,
            ...filterConfigurations.appointments.availableStatuses,
            ...filterConfigurations.invoices.availableStatuses
          ],
          availableServiceTypes: [
            ...filterConfigurations.customers.availableServiceTypes,
            ...filterConfigurations.appointments.availableServiceTypes
          ]
        };
    }
  };

  const filterConfig = getFilterConfig();

  const exportResults = async () => {
    try {
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: searchType === 'all' ? 'search_results' : searchType,
          format: 'csv',
          filters,
          results
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `search-results-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black">

      {/* Navigation Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm mb-6">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="text-blue-300 hover:text-white">
              ← Admin Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/80/5 via-transparent to-purple-500/5" />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 rounded-xl">
              <Search className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Advanced Search</h1>
              <p className="text-white/80">Search across customers, appointments, and invoices</p>
            </div>
          </div>

          {/* Search Type Selector */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { value: 'all', label: 'All Results', icon: Search },
              { value: 'customers', label: 'Customers', icon: Users },
              { value: 'appointments', label: 'Appointments', icon: Calendar },
              { value: 'invoices', label: 'Invoices', icon: FileText }
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setSearchType(value as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-colors ${
                  searchType === value
                    ? 'border-blue-500 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 text-blue-400'
                    : 'border-blue-500/50 bg-black/30 backdrop-blur-lg/50 text-white/80 hover:border-blue-500/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Stats Bar */}
          {(hasResults || hasFilters) && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-black/30 backdrop-blur-lg/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl p-3 text-center">
                <div className="text-2xl font-bold text-white">{stats.totalResults}</div>
                <div className="text-xs text-white/80">Total Results</div>
              </div>
              
              {searchType === 'all' && (
                <>
                  <div className="bg-black/30 backdrop-blur-lg/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">{stats.customerCount}</div>
                    <div className="text-xs text-white/80">Customers</div>
                  </div>
                  <div className="bg-black/30 backdrop-blur-lg/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">{stats.appointmentCount}</div>
                    <div className="text-xs text-white/80">Appointments</div>
                  </div>
                  <div className="bg-black/30 backdrop-blur-lg/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl p-3 text-center">
                    <div className="text-2xl font-bold text-orange-400">{stats.invoiceCount}</div>
                    <div className="text-xs text-white/80">Invoices</div>
                  </div>
                </>
              )}
              
              <div className="bg-black/30 backdrop-blur-lg/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl p-3 text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.searchTime}ms</div>
                <div className="text-xs text-white/80">Search Time</div>
              </div>
            </div>
          )}
        </div>

        {/* Search Filters */}
        <SearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableStatuses={filterConfig.availableStatuses}
          availableServiceTypes={filterConfig.availableServiceTypes}
          availableTechnicians={availableTechnicians}
          showAmountFilter={searchType === 'invoices' || searchType === 'all'}
          showLocationFilter={true}
          showDateFilter={true}
          className="mb-8"
        />

        {/* Action Bar */}
        {hasResults && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-white/80 text-sm">
                Showing {results.length} of {stats.totalResults} results
              </span>
              
              {hasFilters && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-white/80" />
                  <span className="text-white/80 text-sm">Filtered</span>
                </div>
              )}
            </div>

            <button
              onClick={exportResults}
              className="flex items-center gap-2 px-4 py-2 bg-black/30 backdrop-blur-lg hover:bg-black/30 backdrop-blur-lg border border-blue-500/50 rounded-2xl text-white transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Results
            </button>
          </div>
        )}

        {/* Search Results */}
        <SearchResults
          results={results}
          loading={loading}
          error={error}
          showType={searchType === 'all'}
          className="mb-8"
        />

        {/* Pagination */}
        {hasResults && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={pagination.prevPage}
              disabled={!pagination.hasPrevPage}
              className="px-4 py-2 bg-black/30 backdrop-blur-lg hover:bg-black/30 backdrop-blur-lg disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/50 rounded-2xl text-white transition-colors"
            >
              Previous
            </button>
            
            <span className="text-white/80">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <button
              onClick={pagination.nextPage}
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 bg-black/30 backdrop-blur-lg hover:bg-black/30 backdrop-blur-lg disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/50 rounded-2xl text-white transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Quick Search Tips */}
        {!hasFilters && !hasResults && (
          <div className="bg-black/30 backdrop-blur-lg/30 backdrop-blur-sm border border-blue-500/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Search Tips</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-white/80">
              <div>
                <h4 className="font-medium text-white mb-2">Quick Searches:</h4>
                <ul className="space-y-1">
                  <li>• Customer name or email</li>
                  <li>• Account numbers</li>
                  <li>• Invoice numbers</li>
                  <li>• Phone numbers</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">Advanced Filters:</h4>
                <ul className="space-y-1">
                  <li>• Date ranges for appointments</li>
                  <li>• Status filtering</li>
                  <li>• Location-based searches</li>
                  <li>• Technician assignments</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}