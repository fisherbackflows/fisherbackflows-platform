'use client';

import { useState, useEffect } from 'react';
import { 
  Zap,
  Repeat,
  Bell,
  MapPin,
  Route,
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Settings,
  Save,
  Copy,
  Target,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SchedulingTemplate {
  id: string;
  name: string;
  serviceType: string;
  duration: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  notes: string;
}

interface QuickBookingData {
  customerId: string;
  deviceId: string;
  serviceType: string;
  priority: 'low' | 'medium' | 'high';
  preferredTimes: string[];
}

interface AdvancedSchedulingProps {
  onQuickBook?: (data: QuickBookingData) => Promise<void>;
  onTemplateCreate?: (template: SchedulingTemplate) => Promise<void>;
  onRouteOptimize?: (appointmentIds: string[]) => Promise<void>;
  className?: string;
}

export function AdvancedScheduling({ 
  onQuickBook,
  onTemplateCreate,
  onRouteOptimize,
  className = '' 
}: AdvancedSchedulingProps) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [quickBookData, setQuickBookData] = useState<Partial<QuickBookingData>>({});
  const [templateData, setTemplateData] = useState<Partial<SchedulingTemplate>>({});
  const [processing, setProcessing] = useState(false);

  // Quick booking for next available slot
  const handleQuickBook = async () => {
    if (!quickBookData.customerId) {
      alert('Please select a customer');
      return;
    }

    try {
      setProcessing(true);
      
      // Find next available slot
      const response = await fetch('/api/appointments/next-available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: quickBookData.customerId,
          serviceType: quickBookData.serviceType || 'Annual Test',
          priority: quickBookData.priority || 'medium'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && onQuickBook) {
          await onQuickBook(quickBookData as QuickBookingData);
          alert(`Quick booked for ${result.appointment.date} at ${result.appointment.time}`);
          setActiveFeature(null);
          setQuickBookData({});
        }
      }
    } catch (error) {
      console.error('Quick booking failed:', error);
      alert('Quick booking failed. Please try manual booking.');
    } finally {
      setProcessing(false);
    }
  };

  // Create recurring appointment template
  const handleCreateTemplate = async () => {
    if (!templateData.name || !templateData.serviceType) {
      alert('Please fill in template name and service type');
      return;
    }

    try {
      setProcessing(true);
      if (onTemplateCreate) {
        await onTemplateCreate(templateData as SchedulingTemplate);
        alert('Template created successfully!');
        setActiveFeature(null);
        setTemplateData({});
      }
    } catch (error) {
      console.error('Template creation failed:', error);
      alert('Failed to create template. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={`glass rounded-xl border border-blue-400 glow-blue-sm ${className}`}>
      {/* Advanced Features Header */}
      <div className="p-6 border-b border-blue-400/50">
        <h3 className="text-2xl font-bold text-white mb-2">Advanced Scheduling</h3>
        <p className="text-white/90">Powerful tools for efficient appointment management</p>
      </div>

      {/* Feature Selector */}
      <div className="p-6">
        {!activeFeature ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Quick Book Next Available */}
            <div
              onClick={() => setActiveFeature('quick-book')}
              className="group p-6 border border-blue-500/50 rounded-xl hover:border-blue-400 hover:bg-blue-500/10 cursor-pointer transition-all"
            >
              <div className="text-center">
                <div className="p-4 bg-gradient-to-r from-green-600/20 to-green-500/20 border border-green-400 rounded-xl mb-4 group-hover:glow-green-sm transition-all">
                  <Zap className="h-8 w-8 text-green-300 mx-auto" />
                </div>
                <h4 className="font-bold text-white mb-2">Quick Book</h4>
                <p className="text-white/80 text-sm">Book next available slot instantly</p>
              </div>
            </div>

            {/* Recurring Templates */}
            <div
              onClick={() => setActiveFeature('templates')}
              className="group p-6 border border-blue-500/50 rounded-xl hover:border-blue-400 hover:bg-blue-500/10 cursor-pointer transition-all"
            >
              <div className="text-center">
                <div className="p-4 bg-gradient-to-r from-purple-600/20 to-purple-500/20 border border-purple-400 rounded-xl mb-4 group-hover:glow-purple-sm transition-all">
                  <Repeat className="h-8 w-8 text-purple-300 mx-auto" />
                </div>
                <h4 className="font-bold text-white mb-2">Templates</h4>
                <p className="text-white/80 text-sm">Create recurring appointment patterns</p>
              </div>
            </div>

            {/* Route Optimization */}
            <div
              onClick={() => setActiveFeature('route-optimize')}
              className="group p-6 border border-blue-500/50 rounded-xl hover:border-blue-400 hover:bg-blue-500/10 cursor-pointer transition-all"
            >
              <div className="text-center">
                <div className="p-4 bg-gradient-to-r from-orange-600/20 to-orange-500/20 border border-orange-400 rounded-xl mb-4 group-hover:glow-orange-sm transition-all">
                  <Route className="h-8 w-8 text-orange-300 mx-auto" />
                </div>
                <h4 className="font-bold text-white mb-2">Route Optimizer</h4>
                <p className="text-white/80 text-sm">Optimize daily appointment routes</p>
              </div>
            </div>

            {/* Smart Notifications */}
            <div
              onClick={() => setActiveFeature('notifications')}
              className="group p-6 border border-blue-500/50 rounded-xl hover:border-blue-400 hover:bg-blue-500/10 cursor-pointer transition-all"
            >
              <div className="text-center">
                <div className="p-4 bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-400 rounded-xl mb-4 group-hover:glow-blue-sm transition-all">
                  <Bell className="h-8 w-8 text-blue-300 mx-auto" />
                </div>
                <h4 className="font-bold text-white mb-2">Smart Reminders</h4>
                <p className="text-white/80 text-sm">Automated customer notifications</p>
              </div>
            </div>

            {/* Analytics Dashboard */}
            <div
              onClick={() => setActiveFeature('analytics')}
              className="group p-6 border border-blue-500/50 rounded-xl hover:border-blue-400 hover:bg-blue-500/10 cursor-pointer transition-all"
            >
              <div className="text-center">
                <div className="p-4 bg-gradient-to-r from-indigo-600/20 to-indigo-500/20 border border-indigo-400 rounded-xl mb-4 group-hover:glow-indigo-sm transition-all">
                  <TrendingUp className="h-8 w-8 text-indigo-300 mx-auto" />
                </div>
                <h4 className="font-bold text-white mb-2">Analytics</h4>
                <p className="text-white/80 text-sm">Scheduling performance insights</p>
              </div>
            </div>

            {/* Capacity Planning */}
            <div
              onClick={() => setActiveFeature('capacity')}
              className="group p-6 border border-blue-500/50 rounded-xl hover:border-blue-400 hover:bg-blue-500/10 cursor-pointer transition-all"
            >
              <div className="text-center">
                <div className="p-4 bg-gradient-to-r from-cyan-600/20 to-cyan-500/20 border border-cyan-400 rounded-xl mb-4 group-hover:glow-cyan-sm transition-all">
                  <Target className="h-8 w-8 text-cyan-300 mx-auto" />
                </div>
                <h4 className="font-bold text-white mb-2">Capacity Planning</h4>
                <p className="text-white/80 text-sm">Optimize team scheduling capacity</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Feature Implementation Areas */}
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white">
                {activeFeature === 'quick-book' && 'Quick Book Next Available'}
                {activeFeature === 'templates' && 'Recurring Templates'}
                {activeFeature === 'route-optimize' && 'Route Optimization'}
                {activeFeature === 'notifications' && 'Smart Notifications'}
                {activeFeature === 'analytics' && 'Scheduling Analytics'}
                {activeFeature === 'capacity' && 'Capacity Planning'}
              </h4>
              <Button
                variant="ghost"
                onClick={() => setActiveFeature(null)}
                className="text-white/70 hover:text-white"
              >
                ← Back
              </Button>
            </div>

            {/* Quick Book Feature */}
            {activeFeature === 'quick-book' && (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-400/50 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Zap className="h-5 w-5 text-green-400" />
                    <h5 className="font-bold text-white">Lightning Fast Booking</h5>
                  </div>
                  <p className="text-white/90 text-sm mb-4">
                    Instantly book the next available time slot for a customer without manual date/time selection.
                  </p>
                  
                  <div className="space-y-3">
                    <select
                      value={quickBookData.customerId || ''}
                      onChange={(e) => setQuickBookData(prev => ({ ...prev, customerId: e.target.value }))}
                      className="w-full px-3 py-2 bg-black/50 border border-green-500/50 rounded-lg text-white"
                    >
                      <option value="">Select customer...</option>
                      {/* This would be populated from customer data */}
                    </select>
                    
                    <select
                      value={quickBookData.serviceType || ''}
                      onChange={(e) => setQuickBookData(prev => ({ ...prev, serviceType: e.target.value }))}
                      className="w-full px-3 py-2 bg-black/50 border border-green-500/50 rounded-lg text-white"
                    >
                      <option value="">Service type...</option>
                      <option value="Annual Test">Annual Test</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="Repair">Repair</option>
                    </select>

                    <Button
                      onClick={handleQuickBook}
                      disabled={processing || !quickBookData.customerId}
                      className="w-full glass-btn-primary hover:glow-green text-white"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {processing ? 'Finding Slot...' : 'Quick Book Now'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Templates Feature */}
            {activeFeature === 'templates' && (
              <div className="space-y-4">
                <div className="bg-purple-500/10 border border-purple-400/50 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Repeat className="h-5 w-5 text-purple-400" />
                    <h5 className="font-bold text-white">Recurring Appointment Templates</h5>
                  </div>
                  <p className="text-white/90 text-sm mb-4">
                    Create templates for recurring services like annual testing to streamline scheduling.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Template name..."
                      value={templateData.name || ''}
                      onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                      className="px-3 py-2 bg-black/50 border border-purple-500/50 rounded-lg text-white"
                    />
                    
                    <select
                      value={templateData.serviceType || ''}
                      onChange={(e) => setTemplateData(prev => ({ ...prev, serviceType: e.target.value }))}
                      className="px-3 py-2 bg-black/50 border border-purple-500/50 rounded-lg text-white"
                    >
                      <option value="">Service type...</option>
                      <option value="Annual Test">Annual Test</option>
                      <option value="Quarterly Check">Quarterly Check</option>
                      <option value="Monthly Inspection">Monthly Inspection</option>
                    </select>
                    
                    <select
                      value={templateData.frequency || ''}
                      onChange={(e) => setTemplateData(prev => ({ ...prev, frequency: e.target.value as any }))}
                      className="px-3 py-2 bg-black/50 border border-purple-500/50 rounded-lg text-white"
                    >
                      <option value="">Frequency...</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    
                    <select
                      value={templateData.duration || ''}
                      onChange={(e) => setTemplateData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      className="px-3 py-2 bg-black/50 border border-purple-500/50 rounded-lg text-white"
                    >
                      <option value="">Duration...</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                    </select>
                  </div>
                  
                  <textarea
                    placeholder="Template notes and instructions..."
                    value={templateData.notes || ''}
                    onChange={(e) => setTemplateData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full mt-4 px-3 py-2 bg-black/50 border border-purple-500/50 rounded-lg text-white placeholder-white/60"
                  />

                  <Button
                    onClick={handleCreateTemplate}
                    disabled={processing || !templateData.name}
                    className="w-full mt-4 glass-btn-primary hover:glow-purple text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {processing ? 'Creating Template...' : 'Create Template'}
                  </Button>
                </div>
              </div>
            )}

            {/* Route Optimization */}
            {activeFeature === 'route-optimize' && (
              <div className="space-y-4">
                <div className="bg-orange-500/10 border border-orange-400/50 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Route className="h-5 w-5 text-orange-400" />
                    <h5 className="font-bold text-white">Smart Route Planning</h5>
                  </div>
                  <p className="text-white/90 text-sm mb-4">
                    Automatically optimize appointment order to minimize travel time and maximize efficiency.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                      <span className="text-white">Today's Appointments</span>
                      <span className="text-orange-300 font-bold">8 appointments</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                      <span className="text-white">Estimated Travel Time</span>
                      <span className="text-red-300 font-bold">2.5 hours</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-400/50 rounded-lg">
                      <span className="text-white">Optimized Travel Time</span>
                      <span className="text-green-300 font-bold">1.2 hours</span>
                    </div>

                    <Button
                      onClick={() => onRouteOptimize && onRouteOptimize([])}
                      className="w-full glass-btn-primary hover:glow-orange text-white"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Optimize Today's Route
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Smart Notifications */}
            {activeFeature === 'notifications' && (
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-400/50 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Bell className="h-5 w-5 text-blue-400" />
                    <h5 className="font-bold text-white">Automated Reminders</h5>
                  </div>
                  <p className="text-white/90 text-sm mb-4">
                    Configure automated reminder notifications for customers and team members.
                  </p>
                  
                  <div className="space-y-3">
                    {[
                      { time: '24 hours', status: 'enabled', type: 'Email + SMS' },
                      { time: '2 hours', status: 'enabled', type: 'SMS only' },
                      { time: '30 minutes', status: 'disabled', type: 'Push notification' }
                    ].map((reminder, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                        <div>
                          <span className="text-white font-medium">{reminder.time} before</span>
                          <div className="text-white/70 text-xs">{reminder.type}</div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${
                          reminder.status === 'enabled' 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {reminder.status.toUpperCase()}
                        </div>
                      </div>
                    ))}

                    <Button className="w-full glass-btn-primary hover:glow-blue text-white">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure Notifications
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}