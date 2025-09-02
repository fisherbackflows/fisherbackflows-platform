import { Button } from '@/components/ui/button';
import Link from 'next/link';
'use client';

import React, { useState, useEffect } from 'react';
import { 
  UnifiedLayout, 
  UnifiedCard, 
  UnifiedText, 
  UnifiedGrid,
  UnifiedFlex,
  UnifiedButton
} from '@/components/ui';
import { /* siteStructure, */ getPagesByCategory } from '@/lib/site-structure';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ServerIcon,
  CircleStackIcon,
  BoltIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface HealthCheck {
  name: string;
  endpoint: string;
  status: 'healthy' | 'degraded' | 'down' | 'checking';
  responseTime?: number;
  lastChecked?: Date;
  error?: string;
}

export default function HealthMonitoringPage() {
  const [apiHealth, setApiHealth] = useState<HealthCheck[]>([]);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [systemMetrics, setSystemMetrics] = useState({
    uptime: 0,
    totalRequests: 0,
    errorRate: 0,
    avgResponseTime: 0
  });
  const [isChecking, setIsChecking] = useState(false);
  const [lastFullCheck, setLastFullCheck] = useState<Date | null>(null);

  // Initialize API endpoints to check
  useEffect(() => {
    const apiEndpoints = getPagesByCategory('api').map(page => ({
      name: page.title,
      endpoint: page.path,
      status: 'checking' as const,
      responseTime: undefined,
      lastChecked: undefined,
      error: undefined
    }));
    setApiHealth(apiEndpoints);
    performHealthChecks();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(performHealthChecks, 30000);
    return () => clearInterval(interval);
  }, []);

  const performHealthChecks = async () => {
    setIsChecking(true);
    setLastFullCheck(new Date());

    // Check database connection
    try {
      const dbResponse = await fetch('/api/health');
      setDbStatus(dbResponse.ok ? 'connected' : 'disconnected');
    } catch {
      setDbStatus('disconnected');
    }

    // Check API endpoints
    const apiEndpoints = getPagesByCategory('api');
    const healthChecks = await Promise.all(
      apiEndpoints.slice(0, 10).map(async (page) => { // Check first 10 APIs to avoid overload
        const startTime = Date.now();
        try {
          const response = await fetch(page.path, { 
            method: 'GET',
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          const responseTime = Date.now() - startTime;
          
          return {
            name: page.title,
            endpoint: page.path,
            status: response.ok ? 'healthy' : response.status === 401 ? 'healthy' : 'degraded',
            responseTime,
            lastChecked: new Date(),
            error: response.ok || response.status === 401 ? undefined : `Status: ${response.status}`
          } as HealthCheck;
        } catch (error) {
          return {
            name: page.title,
            endpoint: page.path,
            status: 'down',
            responseTime: Date.now() - startTime,
            lastChecked: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error'
          } as HealthCheck;
        }
      })
    );

    setApiHealth(healthChecks);

    // Calculate system metrics
    const healthyCount = healthChecks.filter(h => h.status === 'healthy').length;
    const totalResponseTime = healthChecks.reduce((sum, h) => sum + (h.responseTime || 0), 0);
    
    setSystemMetrics({
      uptime: 99.9, // Mock uptime
      totalRequests: Math.floor(Math.random() * 10000) + 5000,
      errorRate: ((healthChecks.length - healthyCount) / healthChecks.length) * 100,
      avgResponseTime: totalResponseTime / healthChecks.length
    });

    setIsChecking(false);
  };

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'degraded':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
      case 'down':
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      default:
        return <ClockIcon className="h-5 w-5 text-white/40 animate-spin" />;
    }
  };

  const getStatusColor = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/10 border-green-500/20';
      case 'degraded':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'down':
        return 'bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/10 border-red-500/20';
      default:
        return 'glass/5 border-white/10';
    }
  };

  return (
    <UnifiedLayout variant="wide" background="gradient">
      {/* Header */}
      <div className="mb-8">

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

        <UnifiedFlex variant="between">
          <div>
            <UnifiedText variant="primary" size="3xl" weight="bold">
              System Health Monitoring
            </UnifiedText>
            <UnifiedText variant="muted" size="sm">
              Real-time monitoring of all system components
            </UnifiedText>
          </div>
          <UnifiedButton
            variant="secondary"
            size="sm"
            onClick={performHealthChecks}
            disabled={isChecking}
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Refresh'}
          </UnifiedButton>
        </UnifiedFlex>
        {lastFullCheck && (
          <UnifiedText variant="muted" size="xs" className="mt-2">
            Last checked: {lastFullCheck.toLocaleTimeString()}
          </UnifiedText>
        )}
      </div>

      {/* System Overview Cards */}
      <UnifiedGrid cols={4} className="mb-8">
        <UnifiedCard variant="elevated" className="p-6">
          <UnifiedFlex variant="between">
            <div>
              <UnifiedText variant="muted" size="sm">Database Status</UnifiedText>
              <UnifiedText variant="primary" size="2xl" weight="bold">
                {dbStatus === 'connected' ? 'Connected' : dbStatus === 'checking' ? 'Checking...' : 'Disconnected'}
              </UnifiedText>
            </div>
            <CircleStackIcon className={`h-10 w-10 ${
              dbStatus === 'connected' ? 'text-green-400' : 
              dbStatus === 'checking' ? 'text-yellow-400' : 'text-red-400'
            }`} />
          </UnifiedFlex>
        </UnifiedCard>

        <UnifiedCard variant="elevated" className="p-6">
          <UnifiedFlex variant="between">
            <div>
              <UnifiedText variant="muted" size="sm">System Uptime</UnifiedText>
              <UnifiedText variant="primary" size="2xl" weight="bold">
                {systemMetrics.uptime}%
              </UnifiedText>
            </div>
            <BoltIcon className="h-10 w-10 text-blue-400" />
          </UnifiedFlex>
        </UnifiedCard>

        <UnifiedCard variant="elevated" className="p-6">
          <UnifiedFlex variant="between">
            <div>
              <UnifiedText variant="muted" size="sm">API Error Rate</UnifiedText>
              <UnifiedText variant="primary" size="2xl" weight="bold">
                {systemMetrics.errorRate.toFixed(1)}%
              </UnifiedText>
            </div>
            <ExclamationTriangleIcon className={`h-10 w-10 ${
              systemMetrics.errorRate < 5 ? 'text-green-400' :
              systemMetrics.errorRate < 10 ? 'text-yellow-400' : 'text-red-400'
            }`} />
          </UnifiedFlex>
        </UnifiedCard>

        <UnifiedCard variant="elevated" className="p-6">
          <UnifiedFlex variant="between">
            <div>
              <UnifiedText variant="muted" size="sm">Avg Response Time</UnifiedText>
              <UnifiedText variant="primary" size="2xl" weight="bold">
                {Math.round(systemMetrics.avgResponseTime)}ms
              </UnifiedText>
            </div>
            <ChartBarIcon className={`h-10 w-10 ${
              systemMetrics.avgResponseTime < 200 ? 'text-green-400' :
              systemMetrics.avgResponseTime < 500 ? 'text-yellow-400' : 'text-red-400'
            }`} />
          </UnifiedFlex>
        </UnifiedCard>
      </UnifiedGrid>

      {/* API Health Status */}
      <UnifiedCard variant="elevated" className="p-6">
        <UnifiedFlex variant="between" className="mb-6">
          <UnifiedFlex gap="sm">
            <ServerIcon className="h-6 w-6 text-purple-400" />
            <UnifiedText variant="primary" size="xl" weight="semibold">
              API Endpoints Health
            </UnifiedText>
          </UnifiedFlex>
          <UnifiedText variant="muted" size="sm">
            Monitoring {apiHealth.length} endpoints
          </UnifiedText>
        </UnifiedFlex>

        <div className="space-y-2">
          {apiHealth.map((check) => (
            <div
              key={check.endpoint}
              className={`p-4 rounded-2xl backdrop-blur-sm ${getStatusColor(check.status)} border transition-all duration-300`}
            >
              <UnifiedFlex variant="between">
                <UnifiedFlex gap="sm">
                  {getStatusIcon(check.status)}
                  <div>
                    <UnifiedText variant="primary" size="sm" weight="medium">
                      {check.name}
                    </UnifiedText>
                    <UnifiedText variant="muted" size="xs" className="font-mono">
                      {check.endpoint}
                    </UnifiedText>
                  </div>
                </UnifiedFlex>
                
                <UnifiedFlex gap="md">
                  {check.responseTime !== undefined && (
                    <div className="text-right">
                      <UnifiedText variant="muted" size="xs">Response Time</UnifiedText>
                      <UnifiedText variant="primary" size="sm" weight="medium">
                        {check.responseTime}ms
                      </UnifiedText>
                    </div>
                  )}
                  
                  {check.error && (
                    <div className="text-right max-w-xs">
                      <UnifiedText variant="danger" size="xs">
                        {check.error}
                      </UnifiedText>
                    </div>
                  )}
                  
                  <div className="text-right">
                    <UnifiedText variant="muted" size="xs">Status</UnifiedText>
                    <UnifiedText 
                      variant={check.status === 'healthy' ? 'success' : check.status === 'degraded' ? 'warning' : 'danger'} 
                      size="sm" 
                      weight="medium"
                      className="capitalize"
                    >
                      {check.status}
                    </UnifiedText>
                  </div>
                </UnifiedFlex>
              </UnifiedFlex>
            </div>
          ))}
        </div>

        {apiHealth.length === 0 && (
          <div className="text-center py-8">
            <UnifiedText variant="muted" size="lg">
              No API endpoints to monitor
            </UnifiedText>
          </div>
        )}
      </UnifiedCard>

      {/* System Status Summary */}
      <UnifiedCard variant="elevated" className="mt-8 p-6">
        <UnifiedText variant="primary" size="lg" weight="semibold" className="mb-4">
          System Status Summary
        </UnifiedText>
        <UnifiedGrid cols={3} gap="sm">
          <div className="p-4 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/10 border border-green-500/20 rounded-2xl">
            <UnifiedFlex gap="sm">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <div>
                <UnifiedText variant="success" size="sm" weight="medium">
                  Healthy Services
                </UnifiedText>
                <UnifiedText variant="primary" size="2xl" weight="bold">
                  {apiHealth.filter(h => h.status === 'healthy').length}
                </UnifiedText>
              </div>
            </UnifiedFlex>
          </div>

          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
            <UnifiedFlex gap="sm">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div>
                <UnifiedText variant="warning" size="sm" weight="medium">
                  Degraded Services
                </UnifiedText>
                <UnifiedText variant="primary" size="2xl" weight="bold">
                  {apiHealth.filter(h => h.status === 'degraded').length}
                </UnifiedText>
              </div>
            </UnifiedFlex>
          </div>

          <div className="p-4 bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/10 border border-red-500/20 rounded-2xl">
            <UnifiedFlex gap="sm">
              <XCircleIcon className="h-5 w-5 text-red-400" />
              <div>
                <UnifiedText variant="danger" size="sm" weight="medium">
                  Down Services
                </UnifiedText>
                <UnifiedText variant="primary" size="2xl" weight="bold">
                  {apiHealth.filter(h => h.status === 'down').length}
                </UnifiedText>
              </div>
            </UnifiedFlex>
          </div>
        </UnifiedGrid>
      </UnifiedCard>
    </UnifiedLayout>
  );
}