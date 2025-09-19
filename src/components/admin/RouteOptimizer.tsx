'use client';

import React, { useState, useCallback } from 'react';
import {
  MapPin,
  Route,
  Clock,
  Fuel,
  TrendingUp,
  Plus,
  X,
  Navigation,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Location,
  RouteOptimizationParams,
  RouteOptimizationResult,
  optimizeRoute
} from '@/lib/route-optimization';

interface RouteOptimizerProps {
  initialLocations?: Location[];
}

export default function RouteOptimizer({ initialLocations = [] }: RouteOptimizerProps) {
  const [startLocation, setStartLocation] = useState<Location>({
    id: 'start',
    name: 'Fisher Backflows Office',
    address: '1234 Main St, Tacoma, WA 98402',
    latitude: 47.2529,
    longitude: -122.4443
  });

  const [destinations, setDestinations] = useState<Location[]>(initialLocations);
  const [optimizationResult, setOptimizationResult] = useState<RouteOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [newLocation, setNewLocation] = useState<Partial<Location>>({
    priority: 'medium',
    estimatedServiceTime: 60
  });

  const addLocation = useCallback(() => {
    if (!newLocation.name || !newLocation.address) return;

    const location: Location = {
      id: `loc_${Date.now()}`,
      name: newLocation.name,
      address: newLocation.address,
      latitude: newLocation.latitude || 47.2529 + (Math.random() - 0.5) * 0.1,
      longitude: newLocation.longitude || -122.4443 + (Math.random() - 0.5) * 0.1,
      priority: newLocation.priority as any || 'medium',
      estimatedServiceTime: newLocation.estimatedServiceTime || 60,
      timeWindow: newLocation.timeWindow
    };

    setDestinations(prev => [...prev, location]);
    setNewLocation({
      priority: 'medium',
      estimatedServiceTime: 60
    });
  }, [newLocation]);

  const removeLocation = useCallback((id: string) => {
    setDestinations(prev => prev.filter(loc => loc.id !== id));
  }, []);

  const handleOptimize = useCallback(async () => {
    if (destinations.length === 0) return;

    setIsOptimizing(true);
    try {
      const params: RouteOptimizationParams = {
        startLocation,
        destinations,
        maxRouteTime: 480, // 8 hours
        trafficConsideration: true,
        prioritizeTimeWindows: true
      };

      const result = await optimizeRoute(params);
      setOptimizationResult(result);
    } catch (error) {
      console.error('Route optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [startLocation, destinations]);

  const exportRoute = useCallback(() => {
    if (!optimizationResult) return;

    const route = optimizationResult.routes[0];
    const data = {
      route: route.route.map((loc, index) => ({
        order: index + 1,
        name: loc.name || `Stop ${index + 1}`,
        address: loc.address,
        priority: loc.priority,
        estimatedServiceTime: loc.estimatedServiceTime,
        timeWindow: loc.timeWindow
      })),
      summary: {
        totalDistance: `${route.totalDistance.toFixed(1)} km`,
        totalTime: `${Math.round(route.totalTime / 60)} hours ${route.totalTime % 60} minutes`,
        estimatedFuelCost: `$${route.estimatedFuelCost.toFixed(2)}`,
        efficiency: `${(route.efficiency * 100).toFixed(1)}%`
      },
      recommendations: optimizationResult.recommendations
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route-optimization-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [optimizationResult]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-blue-400';
      case 'low': return 'text-gray-800';
      default: return 'text-blue-400';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-green-500/5" />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Route Optimizer</h1>
            <p className="text-white/60 mt-2">
              AI-powered route optimization for maximum efficiency
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {optimizationResult && (
              <Button
                onClick={exportRoute}
                className="btn-glass px-4 py-2 rounded-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Route
              </Button>
            )}
            
            <Button
              onClick={handleOptimize}
              disabled={destinations.length === 0 || isOptimizing}
              className="btn-primary px-6 py-2 rounded-lg"
            >
              {isOptimizing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Route className="h-4 w-4 mr-2" />
              )}
              Optimize Route
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Route Planning */}
          <div className="space-y-6">
            {/* Start Location */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Start Location</h2>
              <div className="flex items-center space-x-3 p-4 glass-darker rounded-xl">
                <MapPin className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-white font-medium">{startLocation.name}</p>
                  <p className="text-white/60 text-sm">{startLocation.address}</p>
                </div>
              </div>
            </div>

            {/* Add Location */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Add Destination</h2>
              <div className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Location Name"
                    value={newLocation.name || ''}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                    className="input-glass"
                  />
                  <select
                    value={newLocation.priority || 'medium'}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="input-glass"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <input
                  type="text"
                  placeholder="Address"
                  value={newLocation.address || ''}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                  className="input-glass"
                />
                
                <div className="grid md:grid-cols-3 gap-4">
                  <input
                    type="number"
                    placeholder="Service Time (min)"
                    value={newLocation.estimatedServiceTime || ''}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, estimatedServiceTime: parseInt(e.target.value) || undefined }))}
                    className="input-glass"
                  />
                  <input
                    type="time"
                    placeholder="Time Window Start"
                    value={newLocation.timeWindow?.start || ''}
                    onChange={(e) => setNewLocation(prev => ({
                      ...prev,
                      timeWindow: { ...prev.timeWindow, start: e.target.value, end: prev.timeWindow?.end || '' }
                    }))}
                    className="input-glass"
                  />
                  <input
                    type="time"
                    placeholder="Time Window End"
                    value={newLocation.timeWindow?.end || ''}
                    onChange={(e) => setNewLocation(prev => ({
                      ...prev,
                      timeWindow: { ...prev.timeWindow, start: prev.timeWindow?.start || '', end: e.target.value }
                    }))}
                    className="input-glass"
                  />
                </div>
                
                <Button
                  onClick={addLocation}
                  className="btn-glass w-full py-2 rounded-lg"
                  disabled={!newLocation.name || !newLocation.address}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </div>
            </div>

            {/* Destinations List */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Destinations ({destinations.length})
              </h2>
              
              {destinations.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No destinations added yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {destinations.map((location, index) => (
                    <div key={location.id} className="flex items-center justify-between p-4 glass-darker rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-700/20 rounded-full flex items-center justify-center text-blue-400 text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium">{location.name}</p>
                          <p className="text-white/60 text-sm">{location.address}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className={`text-xs ${getPriorityColor(location.priority || 'medium')}`}>
                              {location.priority?.toUpperCase()}
                            </span>
                            {location.estimatedServiceTime && (
                              <span className="text-white/50 text-xs">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {location.estimatedServiceTime}min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeLocation(location.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Optimization Results */}
          <div className="space-y-6">
            {optimizationResult ? (
              <>
                {/* Route Summary */}
                <div className="glass rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Optimized Route</h2>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 glass-darker rounded-xl">
                      <Navigation className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {optimizationResult.totalDistance.toFixed(1)}
                      </div>
                      <div className="text-white/60 text-sm">kilometers</div>
                    </div>
                    
                    <div className="text-center p-4 glass-darker rounded-xl">
                      <Clock className="h-6 w-6 text-green-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {formatTime(optimizationResult.totalTime)}
                      </div>
                      <div className="text-white/60 text-sm">total time</div>
                    </div>
                    
                    <div className="text-center p-4 glass-darker rounded-xl">
                      <Fuel className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        ${optimizationResult.routes[0].estimatedFuelCost.toFixed(2)}
                      </div>
                      <div className="text-white/60 text-sm">fuel cost</div>
                    </div>
                    
                    <div className="text-center p-4 glass-darker rounded-xl">
                      <TrendingUp className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {(optimizationResult.routes[0].efficiency * 100).toFixed(1)}%
                      </div>
                      <div className="text-white/60 text-sm">efficiency</div>
                    </div>
                  </div>

                  {/* Route Steps */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {optimizationResult.routes[0].route.map((location, index) => (
                      <div key={`${location.id}-${index}`} className="flex items-center space-x-3 p-3 glass-darker rounded-xl">
                        <div className="w-8 h-8 bg-blue-700/20 rounded-full flex items-center justify-center text-blue-400 text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{location.name}</p>
                          <p className="text-white/60 text-sm">{location.address}</p>
                        </div>
                        {location.priority && (
                          <span className={`text-xs px-2 py-1 rounded-full bg-black/20 ${getPriorityColor(location.priority)}`}>
                            {location.priority.toUpperCase()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                {optimizationResult.recommendations.length > 0 && (
                  <div className="glass rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Recommendations</h3>
                    <div className="space-y-3">
                      {optimizationResult.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 glass-darker rounded-xl">
                          <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <p className="text-white/90 text-sm">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Optimization Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/60">Algorithm:</span>
                      <span className="text-white ml-2">{optimizationResult.metadata.algorithm}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Processing Time:</span>
                      <span className="text-white ml-2">{optimizationResult.metadata.processingTime}ms</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="glass rounded-2xl p-6">
                <div className="text-center py-12">
                  <Route className="h-16 w-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60 mb-4">Add destinations and click "Optimize Route" to see results</p>
                  <div className="text-white/40 text-sm">
                    <p>• Add multiple locations with priorities</p>
                    <p>• Set time windows for optimal scheduling</p>
                    <p>• Get AI-powered route optimization</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}