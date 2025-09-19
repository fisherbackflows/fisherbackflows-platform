'use client';

import { useState, useEffect } from 'react';
import { FieldNavigation } from '@/components/navigation/UnifiedNavigation';
import { UnifiedPageLayout } from '@/components/ui/UnifiedTheme';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Navigation,
  FileText,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Appointment {
  id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  service_address: string;
  scheduled_date: string;
  scheduled_time_start: string;
  scheduled_time_end: string;
  service_type: string;
  device_count: number;
  priority: 'standard' | 'urgent' | 'follow_up';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  travel_time?: number;
  estimated_duration?: number;
}

export default function FieldAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/field/appointments?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'scheduled': 'bg-blue-500/20 text-blue-300 border-blue-400',
      'in_progress': 'bg-yellow-500/20 text-yellow-300 border-yellow-400', 
      'completed': 'bg-green-500/20 text-green-300 border-green-400',
      'cancelled': 'bg-red-500/20 text-red-300 border-red-400'
    };
    return colors[status as keyof typeof colors] || colors.scheduled;
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

  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      appointment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.service_address.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  return (
    <UnifiedPageLayout navigation={<FieldNavigation />}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Field Appointments</h1>
          <p className="text-white/70 text-lg">View and manage your daily schedule</p>
        </div>

        {/* Date and Filters */}
        <Card className="glass border-blue-400/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                <span className="text-white font-medium">Schedule Date:</span>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="glass border-blue-400/50 text-white"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-blue-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="glass border-blue-400/50 text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 flex-1">
                <Search className="h-5 w-5 text-blue-400" />
                <Input
                  placeholder="Search customers or addresses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass border-blue-400/50 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass border-blue-400/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Total Appointments</p>
                  <p className="text-2xl font-bold text-white">{appointments.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-green-400/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-white">
                    {appointments.filter(a => a.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-yellow-400/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">In Progress</p>
                  <p className="text-2xl font-bold text-white">
                    {appointments.filter(a => a.status === 'in_progress').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-purple-400/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Remaining</p>
                  <p className="text-2xl font-bold text-white">
                    {appointments.filter(a => a.status === 'scheduled').length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments List */}
        <Card className="glass border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Appointments for {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardTitle>
            <CardDescription className="text-white/70">
              {filteredAppointments.length} appointments
              {statusFilter !== 'all' && ` (filtered by ${statusFilter})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-white/70 mt-4">Loading appointments...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/70 text-lg">No appointments found</p>
                <p className="text-white/50">Try selecting a different date or adjusting filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments
                  .sort((a, b) => a.scheduled_time_start.localeCompare(b.scheduled_time_start))
                  .map((appointment) => (
                  <div key={appointment.id} className="glass rounded-xl p-6 border border-white/10 hover:border-blue-400/50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-blue-400" />
                            <span className="text-white font-semibold">
                              {formatTime(appointment.scheduled_time_start)} - {formatTime(appointment.scheduled_time_end)}
                            </span>
                          </div>
                          <Badge className={`${getStatusColor(appointment.status)} text-xs border`}>
                            {appointment.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={`${getPriorityColor(appointment.priority)} text-xs border`}>
                            {appointment.priority.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-white/70" />
                            <span className="text-white font-medium">{appointment.customer_name}</span>
                          </div>
                          {appointment.customer_phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-white/70" />
                              <a href={`tel:${appointment.customer_phone}`} className="text-blue-400 hover:text-blue-300">
                                {appointment.customer_phone}
                              </a>
                            </div>
                          )}
                          {appointment.customer_email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-white/70" />
                              <a href={`mailto:${appointment.customer_email}`} className="text-blue-400 hover:text-blue-300">
                                {appointment.customer_email}
                              </a>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-white/70" />
                          <span className="text-white/90">{appointment.service_address}</span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-white/70">
                          <span>Service: {appointment.service_type}</span>
                          <span>Devices: {appointment.device_count}</span>
                          {appointment.estimated_duration && (
                            <span>Duration: {appointment.estimated_duration}min</span>
                          )}
                        </div>
                        
                        {appointment.notes && (
                          <p className="text-white/80 text-sm bg-white/5 rounded-lg p-3 mt-2">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2 lg:w-48">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="glass border-blue-400/50 text-white hover:bg-blue-500/20"
                          onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(appointment.service_address)}`, '_blank')}
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Navigate
                        </Button>
                        
                        {appointment.status === 'scheduled' && (
                          <Button 
                            size="sm" 
                            className="glass-btn-primary hover:glow-blue"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Start Test
                          </Button>
                        )}
                        
                        {appointment.status === 'in_progress' && (
                          <Button 
                            size="sm" 
                            className="bg-green-500/20 border border-green-400 text-green-300 hover:bg-green-500/30"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete
                          </Button>
                        )}
                        
                        <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                          <ChevronRight className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
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