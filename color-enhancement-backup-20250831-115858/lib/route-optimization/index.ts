export interface Location {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  name?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  timeWindow?: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  estimatedServiceTime?: number; // minutes
}

export interface RouteOptimizationParams {
  startLocation: Location;
  destinations: Location[];
  vehicleCapacity?: number;
  maxRouteTime?: number; // minutes
  trafficConsideration?: boolean;
  prioritizeTimeWindows?: boolean;
}

export interface OptimizedRoute {
  route: Location[];
  totalDistance: number; // kilometers
  totalTime: number; // minutes
  estimatedFuelCost: number;
  efficiency: number; // 0-1 score
}

export interface RouteOptimizationResult {
  routes: OptimizedRoute[];
  totalDistance: number;
  totalTime: number;
  recommendations: string[];
  metadata: {
    algorithm: string;
    processingTime: number;
    optimizationScore: number;
  };
}

// Haversine formula to calculate distance between two points
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate estimated travel time (basic formula)
export function calculateTravelTime(distance: number, trafficFactor: number = 1.0): number {
  const averageSpeed = 45; // km/h average for city driving
  return (distance / averageSpeed) * 60 * trafficFactor; // minutes
}

// Priority scoring for locations
export function getPriorityScore(location: Location): number {
  const priorityScores = {
    urgent: 1.0,
    high: 0.8,
    medium: 0.6,
    low: 0.4
  };
  return priorityScores[location.priority || 'medium'];
}

// Check if current time is within time window
export function isWithinTimeWindow(location: Location, currentTime: string): boolean {
  if (!location.timeWindow) return true;
  
  const current = parseTime(currentTime);
  const start = parseTime(location.timeWindow.start);
  const end = parseTime(location.timeWindow.end);
  
  return current >= start && current <= end;
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Nearest neighbor algorithm (simple but effective)
export function nearestNeighborOptimization(params: RouteOptimizationParams): OptimizedRoute {
  const { startLocation, destinations } = params;
  const route: Location[] = [startLocation];
  const remaining = [...destinations];
  let currentLocation = startLocation;
  let totalDistance = 0;
  let totalTime = 0;

  while (remaining.length > 0) {
    let nearest = remaining[0];
    let nearestIndex = 0;
    let shortestDistance = calculateDistance(
      currentLocation.latitude, currentLocation.longitude,
      nearest.latitude, nearest.longitude
    );

    // Find nearest location with priority consideration
    for (let i = 1; i < remaining.length; i++) {
      const location = remaining[i];
      const distance = calculateDistance(
        currentLocation.latitude, currentLocation.longitude,
        location.latitude, location.longitude
      );
      
      // Adjust distance based on priority
      const priorityAdjustedDistance = distance / getPriorityScore(location);
      
      if (priorityAdjustedDistance < shortestDistance) {
        nearest = location;
        nearestIndex = i;
        shortestDistance = distance;
      }
    }

    // Add to route
    route.push(nearest);
    remaining.splice(nearestIndex, 1);
    
    // Update totals
    const segmentDistance = calculateDistance(
      currentLocation.latitude, currentLocation.longitude,
      nearest.latitude, nearest.longitude
    );
    const segmentTime = calculateTravelTime(segmentDistance) + (nearest.estimatedServiceTime || 30);
    
    totalDistance += segmentDistance;
    totalTime += segmentTime;
    currentLocation = nearest;
  }

  // Calculate efficiency score
  const theoreticalMinDistance = destinations.length * 5; // Assume 5km average
  const efficiency = Math.max(0, Math.min(1, theoreticalMinDistance / totalDistance));

  return {
    route,
    totalDistance,
    totalTime,
    estimatedFuelCost: totalDistance * 0.15, // $0.15 per km estimate
    efficiency
  };
}

// 2-opt optimization to improve route
export function twoOptImprovement(route: Location[]): Location[] {
  let improved = true;
  let currentRoute = [...route];

  while (improved) {
    improved = false;
    
    for (let i = 1; i < currentRoute.length - 2; i++) {
      for (let j = i + 1; j < currentRoute.length - 1; j++) {
        if (j - i === 1) continue; // Skip adjacent edges
        
        const currentDistance = 
          calculateDistance(currentRoute[i].latitude, currentRoute[i].longitude, 
                          currentRoute[i + 1].latitude, currentRoute[i + 1].longitude) +
          calculateDistance(currentRoute[j].latitude, currentRoute[j].longitude, 
                          currentRoute[j + 1].latitude, currentRoute[j + 1].longitude);
        
        const swapDistance = 
          calculateDistance(currentRoute[i].latitude, currentRoute[i].longitude, 
                          currentRoute[j].latitude, currentRoute[j].longitude) +
          calculateDistance(currentRoute[i + 1].latitude, currentRoute[i + 1].longitude, 
                          currentRoute[j + 1].latitude, currentRoute[j + 1].longitude);
        
        if (swapDistance < currentDistance) {
          // Reverse the segment between i+1 and j
          const newRoute = [...currentRoute];
          const segment = newRoute.slice(i + 1, j + 1).reverse();
          newRoute.splice(i + 1, j - i, ...segment);
          currentRoute = newRoute;
          improved = true;
        }
      }
    }
  }

  return currentRoute;
}

// Main optimization function
export async function optimizeRoute(params: RouteOptimizationParams): Promise<RouteOptimizationResult> {
  const startTime = Date.now();
  
  try {
    // Step 1: Initial route using nearest neighbor
    let optimizedRoute = nearestNeighborOptimization(params);
    
    // Step 2: Apply 2-opt improvement
    const improvedRoute = twoOptImprovement(optimizedRoute.route);
    
    // Recalculate metrics for improved route
    let totalDistance = 0;
    let totalTime = 0;
    
    for (let i = 0; i < improvedRoute.length - 1; i++) {
      const distance = calculateDistance(
        improvedRoute[i].latitude, improvedRoute[i].longitude,
        improvedRoute[i + 1].latitude, improvedRoute[i + 1].longitude
      );
      totalDistance += distance;
      totalTime += calculateTravelTime(distance) + (improvedRoute[i + 1].estimatedServiceTime || 30);
    }
    
    optimizedRoute = {
      route: improvedRoute,
      totalDistance,
      totalTime,
      estimatedFuelCost: totalDistance * 0.15,
      efficiency: Math.max(0, Math.min(1, (params.destinations.length * 5) / totalDistance))
    };
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (optimizedRoute.efficiency < 0.7) {
      recommendations.push('Route efficiency is below optimal. Consider grouping nearby locations.');
    }
    
    if (optimizedRoute.totalTime > 480) { // 8 hours
      recommendations.push('Route exceeds 8 hours. Consider splitting into multiple days.');
    }
    
    const urgentStops = params.destinations.filter(d => d.priority === 'urgent');
    if (urgentStops.length > 0) {
      recommendations.push(`${urgentStops.length} urgent stop(s) detected. Prioritized in route.`);
    }
    
    const timeWindowViolations = optimizedRoute.route.filter(location => 
      location.timeWindow && !isWithinTimeWindow(location, '09:00')
    );
    if (timeWindowViolations.length > 0) {
      recommendations.push('Some locations may have time window constraints. Verify schedule feasibility.');
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      routes: [optimizedRoute],
      totalDistance: optimizedRoute.totalDistance,
      totalTime: optimizedRoute.totalTime,
      recommendations,
      metadata: {
        algorithm: 'Nearest Neighbor + 2-opt',
        processingTime,
        optimizationScore: optimizedRoute.efficiency
      }
    };
    
  } catch (error) {
    console.error('Route optimization error:', error);
    
    // Fallback: return simple route in original order
    const fallbackRoute: Location[] = [params.startLocation, ...params.destinations];
    let totalDistance = 0;
    let totalTime = 0;
    
    for (let i = 0; i < fallbackRoute.length - 1; i++) {
      const distance = calculateDistance(
        fallbackRoute[i].latitude, fallbackRoute[i].longitude,
        fallbackRoute[i + 1].latitude, fallbackRoute[i + 1].longitude
      );
      totalDistance += distance;
      totalTime += calculateTravelTime(distance) + (fallbackRoute[i + 1].estimatedServiceTime || 30);
    }
    
    return {
      routes: [{
        route: fallbackRoute,
        totalDistance,
        totalTime,
        estimatedFuelCost: totalDistance * 0.15,
        efficiency: 0.5
      }],
      totalDistance,
      totalTime,
      recommendations: ['Route optimization failed. Using fallback sequential route.'],
      metadata: {
        algorithm: 'Fallback Sequential',
        processingTime: Date.now() - startTime,
        optimizationScore: 0.5
      }
    };
  }
}

// Utility function to format address for geocoding
export function formatAddressForGeocoding(address: string): string {
  return address.replace(/[^\w\s,]/g, '').trim();
}

// Get coordinates from address (placeholder - would integrate with geocoding service)
export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  // This would integrate with Google Maps Geocoding API, MapBox, or similar service
  // For now, returning null to indicate external service needed
  console.log('Geocoding address:', formatAddressForGeocoding(address));
  return null;
}