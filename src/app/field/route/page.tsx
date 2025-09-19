'use client';

import { useState, useEffect } from 'react';
import { FieldNavigation } from '@/components/navigation/UnifiedNavigation';
import { UnifiedPageLayout } from '@/components/ui/UnifiedTheme';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MapPin,
  Navigation,
  Clock,
  Route,
  Fuel,
  Calendar,
  User,
  Phone,
  CheckCircle,
  AlertCircle,
  Compass,
  Car,
  Timer,
  Target,
  ArrowRight,
  RefreshCw,
  Settings
} from 'lucide-react';

interface RouteStop {
  id: string;
  appointment_id: string;
  customer_name: string;
  service_address: string;
  scheduled_time_start: string;
  scheduled_time_end: string;
  estimated_duration: number;
  priority: 'standard' | 'urgent' | 'follow_up';
  status: 'pending' | 'current' | 'completed' | 'skipped';
  contact_phone?: string;
  service_type: string;
  device_count: number;
  special_instructions?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  travel_time_to_next?: number;
  distance_to_next?: number;
}

interface RouteOptimization {
  total_distance: number;
  total_travel_time: number;
  total_service_time: number;
  fuel_estimate: number;
  start_time: string;
  end_time: string;
  optimization_score: number;
}

export default function FieldRoutePage() {
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [routeOptimization, setRouteOptimization] = useState<RouteOptimization | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    getCurrentLocation();
    loadRoute();
  }, [selectedDate]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const loadRoute = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/field/route?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setRouteStops(data.stops || []);
        setRouteOptimization(data.optimization);
      }
    } catch (error) {
      console.error('Failed to load route:', error);
    } finally {
      setLoading(false);
    }
  };

  const optimizeRoute = async () => {
    setOptimizing(true);
    try {
      const response = await fetch(`/api/field/route/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          current_location: currentLocation,
          stops: routeStops.map(stop => ({
            id: stop.id,
            address: stop.service_address,
            priority: stop.priority,
            time_window: {
              start: stop.scheduled_time_start,
              end: stop.scheduled_time_end
            },
            service_duration: stop.estimated_duration
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRouteStops(data.optimized_stops);
        setRouteOptimization(data.optimization);
      }
    } catch (error) {
      console.error('Failed to optimize route:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const updateStopStatus = async (stopId: string, status: RouteStop['status']) => {
    try {
      const response = await fetch(`/api/field/route/stops/${stopId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setRouteStops(prev => 
          prev.map(stop => 
            stop.id === stopId ? { ...stop, status } : stop
          )
        );
      }
    } catch (error) {
      console.error('Failed to update stop status:', error);
    }
  };

  const getStatusColor = (status: RouteStop['status']) => {
    const colors = {
      'pending': 'bg-gray-500/20 text-gray-300 border-gray-400',
      'current': 'bg-blue-500/20 text-blue-300 border-blue-400',
      'completed': 'bg-green-500/20 text-green-300 border-green-400',
      'skipped': 'bg-yellow-500/20 text-yellow-300 border-yellow-400'
    };
    return colors[status] || colors.pending;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'standard': 'bg-gray-500/20 text-gray-300 border-gray-400',
      'urgent': 'bg-red-500/20 text-red-300 border-red-400',
      'follow_up': 'bg-orange-500/20 text-orange-300 border-orange-400'
    };
    return colors[priority as keyof typeof colors] || colors.standard;
  };

  const formatTime = (timeString: string) => {
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const openInMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    if (currentLocation) {
      // Open with directions from current location
      window.open(
        `https://maps.google.com/dir/${currentLocation.lat},${currentLocation.lng}/${encodedAddress}`,
        '_blank'
      );
    } else {
      // Open just the destination
      window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
    }
  };

  const completedStops = routeStops.filter(stop => stop.status === 'completed').length;
  const totalStops = routeStops.length;
  const progressPercentage = totalStops > 0 ? (completedStops / totalStops) * 100 : 0;

  return (
    <UnifiedPageLayout navigation={<FieldNavigation />}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Route Planner</h1>
          <p className="text-white/70 text-lg">Optimized daily route and navigation assistance</p>
        </div>

        {/* Route Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass border-blue-400/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Total Stops</p>
                  <p className="text-2xl font-bold text-white">{totalStops}</p>
                </div>
                <Target className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-green-400/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-white">{completedStops}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-purple-400/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Total Distance</p>
                  <p className="text-2xl font-bold text-white">
                    {routeOptimization ? `${routeOptimization.total_distance.toFixed(1)}mi` : '--'}
                  </p>
                </div>
                <Route className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-orange-400/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Est. Travel Time</p>
                  <p className="text-2xl font-bold text-white">
                    {routeOptimization ? `${Math.round(routeOptimization.total_travel_time)}min` : '--'}
                  </p>
                </div>
                <Timer className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Route Controls */}
        <Card className="glass border-blue-400/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  <span className="text-white font-medium">Route Date:</span>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="glass border-blue-400/50 text-white"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={loadRoute}
                  variant="outline"
                  size="sm"
                  className="glass border-blue-400/50 text-white hover:bg-blue-500/20"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <Button
                  onClick={optimizeRoute}
                  size="sm"
                  className="glass-btn-primary hover:glow-blue"
                  disabled={optimizing || routeStops.length === 0}
                >
                  <Settings className={`h-4 w-4 mr-2 ${optimizing ? 'animate-spin' : ''}`} />
                  {optimizing ? 'Optimizing...' : 'Optimize Route'}
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-sm">Route Progress</span>
                <span className="text-white text-sm font-medium">{completedStops} of {totalStops} completed</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Route Optimization Summary */}
        {routeOptimization && (
          <Card className="glass border-green-400/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Compass className="h-5 w-5 mr-2" />
                Route Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-300">{routeOptimization.total_distance.toFixed(1)}mi</div>
                  <p className="text-white/70 text-sm">Total Distance</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-300">{Math.round(routeOptimization.total_travel_time)}min</div>
                  <p className="text-white/70 text-sm">Travel Time</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-300">{Math.round(routeOptimization.total_service_time)}min</div>
                  <p className="text-white/70 text-sm">Service Time</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-300">${routeOptimization.fuel_estimate.toFixed(2)}</div>
                  <p className="text-white/70 text-sm">Est. Fuel Cost</p>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <Badge className="bg-green-500/20 text-green-300 border-green-400 text-lg">
                  Optimization Score: {(routeOptimization.optimization_score * 100).toFixed(0)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Route Stops */}
        <Card className="glass border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Route className="h-5 w-5 mr-2" />
              Route Stops for {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardTitle>
            <CardDescription className="text-white/70">
              {routeStops.length} stops planned
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-white/70 mt-4">Loading route...</p>
              </div>
            ) : routeStops.length === 0 ? (
              <div className="text-center py-8">
                <Route className="h-16 w-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/70 text-lg">No route stops found</p>
                <p className="text-white/50">Try selecting a different date</p>
              </div>
            ) : (
              <div className="space-y-4">
                {routeStops.map((stop, index) => (
                  <div key={stop.id} className="glass rounded-xl p-6 border border-white/10 hover:border-blue-400/50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start space-x-4">
                        {/* Stop Number */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          stop.status === 'completed' ? 'bg-green-500 text-white' :
                          stop.status === 'current' ? 'bg-blue-500 text-white' :
                          'bg-white/10 text-white/70'
                        }`}>
                          {index + 1}
                        </div>
                        
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-white font-semibold">{stop.customer_name}</h3>
                            <Badge className={`${getStatusColor(stop.status)} text-xs border`}>
                              {stop.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={`${getPriorityColor(stop.priority)} text-xs border`}>
                              {stop.priority.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-white/90">
                            <Clock className="h-4 w-4 text-white/70" />
                            <span>{formatTime(stop.scheduled_time_start)} - {formatTime(stop.scheduled_time_end)}</span>
                            <span className="text-white/70">({stop.estimated_duration}min)</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-white/90">
                            <MapPin className="h-4 w-4 text-white/70" />
                            <span>{stop.service_address}</span>
                          </div>
                          
                          {stop.contact_phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-white/70" />
                              <a href={`tel:${stop.contact_phone}`} className="text-blue-400 hover:text-blue-300">
                                {stop.contact_phone}
                              </a>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-white/70">
                            <span>{stop.service_type}</span>
                            <span>{stop.device_count} devices</span>
                            {stop.travel_time_to_next && index < routeStops.length - 1 && (
                              <span className="flex items-center">
                                <ArrowRight className="h-3 w-3 mr-1" />
                                {Math.round(stop.travel_time_to_next)}min to next
                              </span>
                            )}
                          </div>
                          
                          {stop.special_instructions && (
                            <p className="text-white/80 text-sm bg-white/5 rounded-lg p-3 mt-2">
                              <strong>Note:</strong> {stop.special_instructions}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2 lg:w-48">
                        <Button 
                          onClick={() => openInMaps(stop.service_address)}
                          variant="outline" 
                          size="sm" 
                          className="glass border-blue-400/50 text-white hover:bg-blue-500/20"
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Navigate
                        </Button>
                        
                        {stop.status === 'pending' && (
                          <Button 
                            onClick={() => updateStopStatus(stop.id, 'current')}
                            size="sm" 
                            className="glass-btn-primary hover:glow-blue"
                          >
                            <Car className="h-4 w-4 mr-2" />
                            Start Stop
                          </Button>
                        )}
                        
                        {stop.status === 'current' && (
                          <Button 
                            onClick={() => updateStopStatus(stop.id, 'completed')}
                            size="sm" 
                            className="bg-green-500/20 border border-green-400 text-green-300 hover:bg-green-500/30"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete
                          </Button>
                        )}
                        
                        {stop.status === 'pending' && (
                          <Button 
                            onClick={() => updateStopStatus(stop.id, 'skipped')}
                            variant="ghost" 
                            size="sm" 
                            className="text-yellow-400 hover:text-yellow-300"
                          >
                            Skip Stop
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UnifiedPageLayout>
  );
}