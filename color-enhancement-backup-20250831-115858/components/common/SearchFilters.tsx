'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, MapPin, User, DollarSign } from 'lucide-react';

export interface SearchFilters {
  query: string;
  dateRange: {
    start: string;
    end: string;
  };
  status: string[];
  serviceType: string[];
  location: string;
  amountRange: {
    min: number;
    max: number;
  };
  technician: string;
  customFields?: Record<string, any>;
}

export interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableStatuses?: { label: string; value: string; color?: string }[];
  availableServiceTypes?: { label: string; value: string }[];
  availableTechnicians?: { label: string; value: string }[];
  showAmountFilter?: boolean;
  showLocationFilter?: boolean;
  showDateFilter?: boolean;
  className?: string;
}

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  dateRange: { start: '', end: '' },
  status: [],
  serviceType: [],
  location: '',
  amountRange: { min: 0, max: 0 },
  technician: ''
};

export default function SearchFilters({
  filters,
  onFiltersChange,
  availableStatuses = [],
  availableServiceTypes = [],
  availableTechnicians = [],
  showAmountFilter = false,
  showLocationFilter = true,
  showDateFilter = true,
  className = ''
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    const timeout = setTimeout(() => {
      onFiltersChange(localFilters);
    }, 300);

    setSearchDebounce(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [localFilters.query]);

  // Immediate filter updates for non-search fields
  useEffect(() => {
    if (localFilters.query === filters.query) {
      onFiltersChange(localFilters);
    }
  }, [localFilters]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleArrayFilter = (key: 'status' | 'serviceType', value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const clearFilters = () => {
    setLocalFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
  };

  const hasActiveFilters = () => {
    return (
      localFilters.query.length > 0 ||
      localFilters.status.length > 0 ||
      localFilters.serviceType.length > 0 ||
      localFilters.location.length > 0 ||
      localFilters.technician.length > 0 ||
      localFilters.dateRange.start ||
      localFilters.dateRange.end ||
      (showAmountFilter && (localFilters.amountRange.min > 0 || localFilters.amountRange.max > 0))
    );
  };

  return (
    <div className={`bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search customers, invoices, appointments..."
          value={localFilters.query}
          onChange={(e) => updateFilter('query', e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-white transition-colors"
        >
          <Filter className="w-4 h-4" />
          Advanced Filters
          {hasActiveFilters() && (
            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              !
            </span>
          )}
        </button>

        {hasActiveFilters() && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Date Range */}
            {showDateFilter && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={localFilters.dateRange.start}
                    onChange={(e) => updateFilter('dateRange', { ...localFilters.dateRange, start: e.target.value })}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
                  />
                  <input
                    type="date"
                    value={localFilters.dateRange.end}
                    onChange={(e) => updateFilter('dateRange', { ...localFilters.dateRange, end: e.target.value })}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Status Filter */}
            {availableStatuses.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {availableStatuses.map((status) => (
                    <label key={status.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localFilters.status.includes(status.value)}
                        onChange={() => toggleArrayFilter('status', status.value)}
                        className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/20"
                      />
                      <span className={`ml-2 text-sm ${status.color || 'text-gray-300'}`}>
                        {status.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Service Type Filter */}
            {availableServiceTypes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Service Type</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {availableServiceTypes.map((type) => (
                    <label key={type.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localFilters.serviceType.includes(type.value)}
                        onChange={() => toggleArrayFilter('serviceType', type.value)}
                        className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/20"
                      />
                      <span className="ml-2 text-sm text-gray-300">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Location Filter */}
            {showLocationFilter && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Location
                </label>
                <input
                  type="text"
                  placeholder="City, ZIP, or address"
                  value={localFilters.location}
                  onChange={(e) => updateFilter('location', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
                />
              </div>
            )}

            {/* Technician Filter */}
            {availableTechnicians.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Technician
                </label>
                <select
                  value={localFilters.technician}
                  onChange={(e) => updateFilter('technician', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
                >
                  <option value="">All Technicians</option>
                  {availableTechnicians.map((tech) => (
                    <option key={tech.value} value={tech.value}>
                      {tech.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Amount Range Filter */}
            {showAmountFilter && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Amount Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={localFilters.amountRange.min || ''}
                    onChange={(e) => updateFilter('amountRange', { 
                      ...localFilters.amountRange, 
                      min: parseInt(e.target.value) || 0 
                    })}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={localFilters.amountRange.max || ''}
                    onChange={(e) => updateFilter('amountRange', { 
                      ...localFilters.amountRange, 
                      max: parseInt(e.target.value) || 0 
                    })}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex flex-wrap gap-2">
            {localFilters.status.map((status) => (
              <span
                key={`status-${status}`}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-lg"
              >
                Status: {availableStatuses.find(s => s.value === status)?.label || status}
                <button
                  onClick={() => toggleArrayFilter('status', status)}
                  className="hover:bg-blue-500/30 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {localFilters.serviceType.map((type) => (
              <span
                key={`type-${type}`}
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg"
              >
                Type: {availableServiceTypes.find(t => t.value === type)?.label || type}
                <button
                  onClick={() => toggleArrayFilter('serviceType', type)}
                  className="hover:bg-green-500/30 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {localFilters.location && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-lg">
                Location: {localFilters.location}
                <button
                  onClick={() => updateFilter('location', '')}
                  className="hover:bg-purple-500/30 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {localFilters.technician && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-lg">
                Tech: {availableTechnicians.find(t => t.value === localFilters.technician)?.label || localFilters.technician}
                <button
                  onClick={() => updateFilter('technician', '')}
                  className="hover:bg-orange-500/30 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}