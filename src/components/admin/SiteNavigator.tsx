'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  siteStructure, 
  siteStatistics, 
  getPagesByCategory,
  searchPages,
  type PageInfo 
} from '@/lib/site-structure';
import { 
  UnifiedCard, 
  UnifiedButton, 
  UnifiedInput, 
  UnifiedText,
  UnifiedGrid,
  UnifiedFlex
} from '@/components/ui';
import { 
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  CogIcon,
  WrenchIcon,
  ServerIcon,
  BeakerIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  FunnelIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  GlobeAltIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

// Category configurations with icons and colors
const categoryConfig = {
  homepage: {
    icon: HomeIcon,
    label: 'Homepage & Core',
    color: 'text-white',
    bgColor: 'bg-gradient-to-r from-gray-600 to-gray-500',
    glassColor: 'bg-white/5 border-white/10'
  },
  customer: {
    icon: UsersIcon,
    label: 'Customer Portal',
    color: 'text-blue-400',
    bgColor: 'bg-gradient-to-r from-blue-600 to-blue-500',
    glassColor: 'bg-blue-500/10 border-blue-500/20'
  },
  team: {
    icon: UserGroupIcon,
    label: 'Team Portal',
    color: 'text-green-400',
    bgColor: 'bg-gradient-to-r from-green-600 to-green-500',
    glassColor: 'bg-green-500/10 border-green-500/20'
  },
  admin: {
    icon: CogIcon,
    label: 'Admin Pages',
    color: 'text-purple-400',
    bgColor: 'bg-gradient-to-r from-purple-600 to-purple-500',
    glassColor: 'bg-purple-500/10 border-purple-500/20'
  },
  field: {
    icon: WrenchIcon,
    label: 'Field Operations',
    color: 'text-yellow-400',
    bgColor: 'bg-gradient-to-r from-yellow-600 to-yellow-500',
    glassColor: 'bg-yellow-500/10 border-yellow-500/20'
  },
  api: {
    icon: ServerIcon,
    label: 'API Endpoints',
    color: 'text-red-400',
    bgColor: 'bg-gradient-to-r from-red-600 to-red-500',
    glassColor: 'bg-red-500/10 border-red-500/20'
  },
  app: {
    icon: BeakerIcon,
    label: 'App Pages',
    color: 'text-cyan-400',
    bgColor: 'bg-gradient-to-r from-cyan-600 to-cyan-500',
    glassColor: 'bg-cyan-500/10 border-cyan-500/20'
  }
};

// Status configurations
const statusConfig = {
  active: {
    icon: CheckCircleIcon,
    label: 'Active',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/20'
  },
  development: {
    icon: ClockIcon,
    label: 'Development',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20'
  },
  maintenance: {
    icon: ExclamationTriangleIcon,
    label: 'Maintenance',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/20'
  }
};

export function SiteNavigator() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showAuthOnly, setShowAuthOnly] = useState(false);

  // Filter pages based on current selections
  const filteredPages = useMemo(() => {
    let pages = [...siteStructure];

    // Search filter
    if (searchQuery) {
      pages = searchPages(searchQuery);
    }

    // Category filter
    if (selectedCategory) {
      pages = pages.filter(page => page.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus) {
      pages = pages.filter(page => page.status === selectedStatus);
    }

    // Auth filter
    if (showAuthOnly) {
      pages = pages.filter(page => page.requiresAuth);
    }

    return pages;
  }, [searchQuery, selectedCategory, selectedStatus, showAuthOnly]);

  // Group filtered pages by category for display
  const groupedPages = useMemo(() => {
    const groups: Record<string, PageInfo[]> = {};
    filteredPages.forEach(page => {
      if (!groups[page.category]) {
        groups[page.category] = [];
      }
      groups[page.category].push(page);
    });
    return groups;
  }, [filteredPages]);

  const navigateToPage = (path: string) => {
    // For API routes, show details instead of navigating
    if (path.startsWith('/api')) {
      alert(`API Endpoint: ${path}\nThis is an API route - cannot navigate directly`);
    } else {
      router.push(path);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedStatus(null);
    setShowAuthOnly(false);
  };

  return (
    <div className="space-y-8">
      {/* Statistics Overview */}
      <UnifiedGrid cols={4} className="mb-8">
        <UnifiedCard variant="elevated" className="p-6">
          <UnifiedFlex variant="between">
            <div>
              <UnifiedText variant="muted" size="sm">Total Pages</UnifiedText>
              <UnifiedText variant="primary" size="3xl" weight="bold">
                {siteStatistics.totalPages}
              </UnifiedText>
            </div>
            <DocumentTextIcon className="h-10 w-10 text-blue-400" />
          </UnifiedFlex>
        </UnifiedCard>

        <UnifiedCard variant="elevated" className="p-6">
          <UnifiedFlex variant="between">
            <div>
              <UnifiedText variant="muted" size="sm">Active Pages</UnifiedText>
              <UnifiedText variant="primary" size="3xl" weight="bold">
                {siteStatistics.byStatus.active}
              </UnifiedText>
            </div>
            <CheckCircleIcon className="h-10 w-10 text-green-400" />
          </UnifiedFlex>
        </UnifiedCard>

        <UnifiedCard variant="elevated" className="p-6">
          <UnifiedFlex variant="between">
            <div>
              <UnifiedText variant="muted" size="sm">API Endpoints</UnifiedText>
              <UnifiedText variant="primary" size="3xl" weight="bold">
                {siteStatistics.byCategory.api}
              </UnifiedText>
            </div>
            <ServerIcon className="h-10 w-10 text-red-400" />
          </UnifiedFlex>
        </UnifiedCard>

        <UnifiedCard variant="elevated" className="p-6">
          <UnifiedFlex variant="between">
            <div>
              <UnifiedText variant="muted" size="sm">Protected</UnifiedText>
              <UnifiedText variant="primary" size="3xl" weight="bold">
                {siteStatistics.requiresAuth}
              </UnifiedText>
            </div>
            <ShieldCheckIcon className="h-10 w-10 text-purple-400" />
          </UnifiedFlex>
        </UnifiedCard>
      </UnifiedGrid>

      {/* Search and Filters */}
      <UnifiedCard variant="elevated" className="p-6">
        <UnifiedFlex variant="col" gap="md">
          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <UnifiedInput
              type="text"
              placeholder="Search pages by title, path, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          {/* Filter Controls */}
          <UnifiedFlex variant="between" className="flex-wrap gap-4">
            <UnifiedFlex gap="sm" className="flex-wrap">
              {/* Category Filter */}
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="bg-black/20 border border-white/20 text-white px-4 py-2 rounded-lg focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20"
              >
                <option value="">All Categories</option>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus || ''}
                onChange={(e) => setSelectedStatus(e.target.value || null)}
                className="bg-black/20 border border-white/20 text-white px-4 py-2 rounded-lg focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20"
              >
                <option value="">All Status</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>

              {/* Auth Filter */}
              <UnifiedButton
                variant={showAuthOnly ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setShowAuthOnly(!showAuthOnly)}
                className="flex items-center gap-2"
              >
                <ShieldCheckIcon className="h-4 w-4" />
                Protected Only
              </UnifiedButton>

              {/* Clear Filters */}
              <UnifiedButton
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <FunnelIcon className="h-4 w-4" />
                Clear Filters
              </UnifiedButton>
            </UnifiedFlex>

            <UnifiedText variant="muted" size="sm">
              Showing {filteredPages.length} of {siteStatistics.totalPages} pages
            </UnifiedText>
          </UnifiedFlex>
        </UnifiedFlex>
      </UnifiedCard>

      {/* Category Sections */}
      {Object.entries(groupedPages).map(([category, pages]) => {
        const config = categoryConfig[category as keyof typeof categoryConfig];
        const IconComponent = config?.icon || DocumentTextIcon;

        return (
          <UnifiedCard 
            key={category} 
            variant="elevated" 
            className={`p-6 backdrop-blur-sm ${config?.glassColor || 'bg-white/5 border-white/10'}`}
          >
            {/* Category Header */}
            <UnifiedFlex variant="between" className="mb-6">
              <UnifiedFlex gap="sm">
                <IconComponent className={`h-6 w-6 ${config?.color || 'text-white'}`} />
                <UnifiedText variant="primary" size="xl" weight="semibold">
                  {config?.label || category}
                </UnifiedText>
                <UnifiedText variant="muted" size="sm">
                  ({pages.length} pages)
                </UnifiedText>
              </UnifiedFlex>
            </UnifiedFlex>

            {/* Pages Grid */}
            <UnifiedGrid cols={3} gap="sm">
              {pages.map((page) => {
                const StatusIcon = statusConfig[page.status]?.icon || CheckCircleIcon;
                const isAPI = page.path.startsWith('/api');
                const isDynamic = page.path.includes('[');

                return (
                  <UnifiedCard
                    key={page.path}
                    variant="interactive"
                    className="p-4 cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={() => navigateToPage(page.path)}
                  >
                    <UnifiedFlex variant="col" gap="sm">
                      {/* Page Header */}
                      <UnifiedFlex variant="between">
                        <UnifiedText variant="primary" size="sm" weight="semibold">
                          {page.title}
                        </UnifiedText>
                        <UnifiedFlex gap="sm">
                          {page.requiresAuth && (
                            <ShieldCheckIcon className="h-4 w-4 text-purple-400" />
                          )}
                          <StatusIcon className={`h-4 w-4 ${statusConfig[page.status]?.color}`} />
                        </UnifiedFlex>
                      </UnifiedFlex>

                      {/* Path */}
                      <UnifiedText variant="muted" size="xs" className="font-mono">
                        {page.path}
                      </UnifiedText>

                      {/* Description */}
                      <UnifiedText variant="secondary" size="xs">
                        {page.description}
                      </UnifiedText>

                      {/* Badges */}
                      <UnifiedFlex gap="sm" className="flex-wrap">
                        {isAPI && (
                          <span className="px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400">
                            API
                          </span>
                        )}
                        {isDynamic && (
                          <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-400">
                            Dynamic
                          </span>
                        )}
                        {page.status !== 'active' && (
                          <span className={`px-2 py-1 rounded text-xs ${statusConfig[page.status]?.bgColor}`}>
                            {statusConfig[page.status]?.label}
                          </span>
                        )}
                      </UnifiedFlex>

                      {/* Admin Actions */}
                      <UnifiedFlex gap="sm" className="mt-2">
                        {!isAPI && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(page.path);
                              }}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              title="Visit Page"
                            >
                              <GlobeAltIcon className="h-4 w-4 text-blue-400" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                alert(`Edit page: ${page.path}`);
                              }}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              title="Edit Page"
                            >
                              <PencilSquareIcon className="h-4 w-4 text-green-400" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`View source: ${page.path}`);
                          }}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="View Source"
                        >
                          <CodeBracketIcon className="h-4 w-4 text-purple-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Analytics for: ${page.path}`);
                          }}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="View Analytics"
                        >
                          <ChartBarIcon className="h-4 w-4 text-yellow-400" />
                        </button>
                      </UnifiedFlex>
                    </UnifiedFlex>
                  </UnifiedCard>
                );
              })}
            </UnifiedGrid>
          </UnifiedCard>
        );
      })}

      {/* Empty State */}
      {filteredPages.length === 0 && (
        <UnifiedCard variant="elevated" className="p-12 text-center">
          <UnifiedText variant="muted" size="lg">
            No pages found matching your filters
          </UnifiedText>
          <UnifiedButton
            variant="secondary"
            size="sm"
            onClick={clearFilters}
            className="mt-4"
          >
            Clear Filters
          </UnifiedButton>
        </UnifiedCard>
      )}
    </div>
  );
}