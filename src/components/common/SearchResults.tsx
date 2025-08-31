'use client';

import { useState } from 'react';
import { 
  User, 
  Calendar, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign,
  Clock,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  _type: 'customer' | 'appointment' | 'invoice';
  [key: string]: any;
}

interface SearchResultsProps {
  results: SearchResult[];
  loading?: boolean;
  error?: string | null;
  onResultClick?: (result: SearchResult) => void;
  showType?: boolean;
  className?: string;
}

export default function SearchResults({
  results,
  loading = false,
  error = null,
  onResultClick,
  showType = true,
  className = ''
}: SearchResultsProps) {
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  if (loading) {
    return (
      <div className={`bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 ${className}`}>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-700 rounded-xl p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="text-red-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-red-400 font-medium">Search Error</h3>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={`bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8 text-center ${className}`}>
        <div className="text-gray-800 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
          </svg>
        </div>
        <h3 className="text-white font-medium mb-2">No results found</h3>
        <p className="text-gray-800 text-sm">Try adjusting your search terms or filters</p>
      </div>
    );
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'customer': return User;
      case 'appointment': return Calendar;
      case 'invoice': return FileText;
      default: return User;
    }
  };

  const getResultLink = (result: SearchResult) => {
    switch (result._type) {
      case 'customer':
        return `/team-portal/customers/${result.customer_id}`;
      case 'appointment':
        return `/team-portal/schedule?appointment=${result.appointment_id}`;
      case 'invoice':
        return `/team-portal/invoices/${result.invoice_id}`;
      default:
        return '#';
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'active': 'text-green-400 bg-green-700/20',
      'completed': 'text-green-400 bg-green-700/20',
      'paid': 'text-green-400 bg-green-700/20',
      'scheduled': 'text-blue-400 bg-blue-700/20',
      'pending': 'text-yellow-400 bg-yellow-500/20',
      'overdue': 'text-red-400 bg-red-500/20',
      'cancelled': 'text-red-400 bg-red-500/20',
      'inactive': 'text-gray-800 bg-gray-500/20',
      'draft': 'text-gray-800 bg-gray-500/20'
    };
    return statusColors[status.toLowerCase()] || 'text-gray-800 bg-gray-500/20';
  };

  const renderCustomerResult = (result: any) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-white">{result.name}</h3>
        {result.status && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
            {result.status}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
        {result.email && (
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-gray-800" />
            <span>{result.email}</span>
          </div>
        )}
        {result.phone && (
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-gray-800" />
            <span>{result.phone}</span>
          </div>
        )}
        {result.address && (
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-800" />
            <span>{result.address}, {result.city} {result.state}</span>
          </div>
        )}
        {result.account_number && (
          <div className="flex items-center space-x-2">
            <span className="text-gray-800">Account:</span>
            <span className="font-mono">{result.account_number}</span>
          </div>
        )}
      </div>

      {expandedResult === `customer-${result.customer_id}` && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="text-gray-800 font-medium mb-2">Devices</h4>
              {result.devices?.length > 0 ? (
                <ul className="space-y-1">
                  {result.devices.slice(0, 3).map((device: any) => (
                    <li key={device.device_id} className="text-gray-300">
                      {device.device_type} - {device.location}
                    </li>
                  ))}
                  {result.devices.length > 3 && (
                    <li className="text-gray-800">+{result.devices.length - 3} more</li>
                  )}
                </ul>
              ) : (
                <p className="text-gray-800">No devices</p>
              )}
            </div>
            
            <div>
              <h4 className="text-gray-800 font-medium mb-2">Recent Tests</h4>
              {result.test_reports?.length > 0 ? (
                <ul className="space-y-1">
                  {result.test_reports.slice(0, 3).map((test: any) => (
                    <li key={test.test_id} className="text-gray-300">
                      {new Date(test.test_date).toLocaleDateString()} - {test.status}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-800">No tests recorded</p>
              )}
            </div>

            <div>
              <h4 className="text-gray-800 font-medium mb-2">Balance</h4>
              <p className="text-white font-medium">
                ${result.balance?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAppointmentResult = (result: any) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-white">
          {result.customers?.name || 'Unknown Customer'}
        </h3>
        {result.status && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
            {result.status}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-800" />
          <span>{new Date(result.scheduled_date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-800" />
          <span>{result.estimated_duration || 60} minutes</span>
        </div>
        {result.service_type && (
          <div className="flex items-center space-x-2">
            <span className="text-gray-800">Service:</span>
            <span>{result.service_type}</span>
          </div>
        )}
        {result.team_members?.name && (
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-800" />
            <span>{result.team_members.name}</span>
          </div>
        )}
      </div>

      {result.notes && (
        <div className="mt-2">
          <p className="text-sm text-gray-300 bg-gray-800/50 p-2 rounded">
            {result.notes}
          </p>
        </div>
      )}
    </div>
  );

  const renderInvoiceResult = (result: any) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-white">
          Invoice #{result.invoice_number}
        </h3>
        {result.status && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
            {result.status}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-gray-800" />
          <span>{result.customers?.name || 'Unknown Customer'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-gray-800" />
          <span className="font-medium text-white">${result.amount?.toFixed(2)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-800" />
          <span>Due: {new Date(result.due_date).toLocaleDateString()}</span>
        </div>
        {result.payments?.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-gray-800">Payments:</span>
            <span>{result.payments.length}</span>
          </div>
        )}
      </div>

      {result.description && (
        <div className="mt-2">
          <p className="text-sm text-gray-300">{result.description}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {results.map((result) => {
        const Icon = getResultIcon(result._type);
        const resultId = `${result._type}-${result[`${result._type}_id`] || result.id}`;
        const isExpanded = expandedResult === resultId;

        return (
          <div
            key={resultId}
            className="bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className="p-2 bg-gray-800 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                
                <div className="flex-1">
                  {showType && (
                    <div className="text-xs text-gray-800 uppercase tracking-wide mb-1">
                      {result._type}
                    </div>
                  )}
                  
                  {result._type === 'customer' && renderCustomerResult(result)}
                  {result._type === 'appointment' && renderAppointmentResult(result)}
                  {result._type === 'invoice' && renderInvoiceResult(result)}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setExpandedResult(isExpanded ? null : resultId)}
                  className="p-2 text-gray-800 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
                
                <Link
                  href={getResultLink(result)}
                  className="p-2 text-gray-800 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                  onClick={() => onResultClick?.(result)}
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}