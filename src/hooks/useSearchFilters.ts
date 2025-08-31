'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { SearchFilters } from '@/components/common/SearchFilters';

export interface UseSearchFiltersOptions {
  initialFilters?: Partial<SearchFilters>;
  onSearch?: (results: any[]) => void;
  searchFunction?: (filters: SearchFilters) => Promise<any[]>;
  debounceMs?: number;
}

export function useSearchFilters({
  initialFilters = {},
  onSearch,
  searchFunction,
  debounceMs = 300
}: UseSearchFiltersOptions = {}) {
  const defaultFilters: SearchFilters = {
    query: '',
    dateRange: { start: '', end: '' },
    status: [],
    serviceType: [],
    location: '',
    amountRange: { min: 0, max: 0 },
    technician: '',
    ...initialFilters
  };

  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Debounced search execution
  const debouncedSearch = useCallback(
    debounce(async (searchFilters: SearchFilters) => {
      if (!searchFunction) return;

      setLoading(true);
      setError(null);

      try {
        const searchResults = await searchFunction(searchFilters);
        setResults(searchResults);
        setTotalCount(searchResults.length);
        
        if (onSearch) {
          onSearch(searchResults);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    }, debounceMs),
    [searchFunction, onSearch, debounceMs]
  );

  // Execute search when filters change
  useEffect(() => {
    debouncedSearch(filters);
  }, [filters, debouncedSearch]);

  // Filter utility functions
  const filterUtils = useMemo(() => ({
    // Client-side filtering for arrays of data
    filterArray: <T>(
      data: T[], 
      filterFn: (item: T, filters: SearchFilters) => boolean
    ): T[] => {
      return data.filter(item => filterFn(item, filters));
    },

    // Build query string for API calls
    buildQueryString: (filters: SearchFilters): string => {
      const params = new URLSearchParams();
      
      if (filters.query) params.set('q', filters.query);
      if (filters.dateRange.start) params.set('start_date', filters.dateRange.start);
      if (filters.dateRange.end) params.set('end_date', filters.dateRange.end);
      if (filters.status.length > 0) params.set('status', filters.status.join(','));
      if (filters.serviceType.length > 0) params.set('service_type', filters.serviceType.join(','));
      if (filters.location) params.set('location', filters.location);
      if (filters.technician) params.set('technician', filters.technician);
      if (filters.amountRange.min > 0) params.set('min_amount', filters.amountRange.min.toString());
      if (filters.amountRange.max > 0) params.set('max_amount', filters.amountRange.max.toString());
      
      params.set('page', currentPage.toString());
      params.set('limit', pageSize.toString());

      return params.toString();
    },

    // Build SQL WHERE conditions for Supabase
    buildSupabaseFilter: (query: any, filters: SearchFilters) => {
      let filteredQuery = query;

      // Text search
      if (filters.query) {
        filteredQuery = filteredQuery.or(`name.ilike.%${filters.query}%,email.ilike.%${filters.query}%,account_number.ilike.%${filters.query}%`);
      }

      // Date range
      if (filters.dateRange.start) {
        filteredQuery = filteredQuery.gte('created_at', filters.dateRange.start);
      }
      if (filters.dateRange.end) {
        filteredQuery = filteredQuery.lte('created_at', filters.dateRange.end);
      }

      // Status filter
      if (filters.status.length > 0) {
        filteredQuery = filteredQuery.in('status', filters.status);
      }

      // Service type filter
      if (filters.serviceType.length > 0) {
        filteredQuery = filteredQuery.in('service_type', filters.serviceType);
      }

      // Location filter
      if (filters.location) {
        filteredQuery = filteredQuery.or(`city.ilike.%${filters.location}%,state.ilike.%${filters.location}%,zip_code.ilike.%${filters.location}%`);
      }

      // Technician filter
      if (filters.technician) {
        filteredQuery = filteredQuery.eq('technician_id', filters.technician);
      }

      // Amount range filter
      if (filters.amountRange.min > 0) {
        filteredQuery = filteredQuery.gte('amount', filters.amountRange.min);
      }
      if (filters.amountRange.max > 0) {
        filteredQuery = filteredQuery.lte('amount', filters.amountRange.max);
      }

      return filteredQuery;
    }
  }), [currentPage, pageSize]);

  // Pagination
  const pagination = useMemo(() => ({
    currentPage,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    hasNextPage: currentPage < Math.ceil(totalCount / pageSize),
    hasPrevPage: currentPage > 1,
    goToPage: (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, Math.ceil(totalCount / pageSize))));
    },
    nextPage: () => {
      if (currentPage < Math.ceil(totalCount / pageSize)) {
        setCurrentPage(currentPage + 1);
      }
    },
    prevPage: () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  }), [currentPage, pageSize, totalCount]);

  // Reset function
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  }, []);

  // Update individual filter
  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  return {
    // State
    filters,
    results,
    loading,
    error,
    totalCount,

    // Actions
    setFilters,
    updateFilter,
    resetFilters,

    // Pagination
    pagination,

    // Utilities
    filterUtils,

    // Computed values
    hasResults: results.length > 0,
    isEmpty: !loading && results.length === 0,
    hasFilters: Object.values(filters).some(value => 
      Array.isArray(value) ? value.length > 0 : !!value
    )
  };
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Predefined filter configurations for different data types
export const filterConfigurations = {
  customers: {
    availableStatuses: [
      { label: 'Active', value: 'active', color: 'text-green-400' },
      { label: 'Inactive', value: 'inactive', color: 'text-gray-800' },
      { label: 'Pending', value: 'pending', color: 'text-yellow-400' },
      { label: 'Suspended', value: 'suspended', color: 'text-red-400' }
    ],
    availableServiceTypes: [
      { label: 'Annual Testing', value: 'annual' },
      { label: 'Installation', value: 'installation' },
      { label: 'Repair', value: 'repair' },
      { label: 'Maintenance', value: 'maintenance' }
    ]
  },

  appointments: {
    availableStatuses: [
      { label: 'Scheduled', value: 'scheduled', color: 'text-blue-400' },
      { label: 'In Progress', value: 'in_progress', color: 'text-yellow-400' },
      { label: 'Completed', value: 'completed', color: 'text-green-400' },
      { label: 'Cancelled', value: 'cancelled', color: 'text-red-400' },
      { label: 'No Show', value: 'no_show', color: 'text-orange-400' }
    ],
    availableServiceTypes: [
      { label: 'Testing', value: 'testing' },
      { label: 'Installation', value: 'installation' },
      { label: 'Repair', value: 'repair' },
      { label: 'Maintenance', value: 'maintenance' },
      { label: 'Inspection', value: 'inspection' }
    ]
  },

  invoices: {
    availableStatuses: [
      { label: 'Draft', value: 'draft', color: 'text-gray-800' },
      { label: 'Sent', value: 'sent', color: 'text-blue-400' },
      { label: 'Paid', value: 'paid', color: 'text-green-400' },
      { label: 'Overdue', value: 'overdue', color: 'text-red-400' },
      { label: 'Cancelled', value: 'cancelled', color: 'text-gray-800' }
    ]
  }
};