'use client';

import { useState } from 'react';
import { 
  CheckSquare,
  Square,
  Calendar,
  Clock,
  Users,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  X,
  Send,
  Phone,
  Mail,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkAppointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  time: string;
  type: string;
  status: string;
  selected?: boolean;
}

interface BulkSchedulingProps {
  appointments: BulkAppointment[];
  onSelectionChange: (selectedIds: string[]) => void;
  onBulkAction: (action: string, appointmentIds: string[]) => Promise<void>;
  className?: string;
}

export function BulkScheduling({ 
  appointments, 
  onSelectionChange, 
  onBulkAction,
  className = '' 
}: BulkSchedulingProps) {
  const [selectedAppointments, setSelectedAppointments] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(appointments.map(apt => apt.id));
      setSelectedAppointments(allIds);
      onSelectionChange(Array.from(allIds));
    } else {
      setSelectedAppointments(new Set());
      onSelectionChange([]);
    }
  };

  const handleSelectAppointment = (appointmentId: string, checked: boolean) => {
    const newSelected = new Set(selectedAppointments);
    if (checked) {
      newSelected.add(appointmentId);
    } else {
      newSelected.delete(appointmentId);
    }
    setSelectedAppointments(newSelected);
    onSelectionChange(Array.from(newSelected));
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedAppointments.size === 0) return;
    
    try {
      setProcessing(true);
      await onBulkAction(bulkAction, Array.from(selectedAppointments));
      setSelectedAppointments(new Set());
      setBulkAction('');
      setShowConfirmation(false);
      onSelectionChange([]);
    } catch (error) {
      console.error('Bulk action failed:', error);
      alert('Bulk action failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getActionDescription = (action: string) => {
    const descriptions = {
      'confirm': 'Confirm selected appointments',
      'reschedule': 'Reschedule selected appointments',
      'cancel': 'Cancel selected appointments',
      'send-reminders': 'Send reminder notifications',
      'mark-completed': 'Mark as completed',
      'export': 'Export appointment details',
      'print-schedule': 'Print appointment schedule'
    };
    return descriptions[action] || action;
  };

  const selectedCount = selectedAppointments.size;
  const allSelected = selectedCount === appointments.length && appointments.length > 0;
  const partialSelected = selectedCount > 0 && selectedCount < appointments.length;

  return (
    <div className={`glass rounded-xl border border-blue-400 glow-blue-sm ${className}`}>
      {/* Bulk Actions Header */}
      <div className="p-6 border-b border-blue-400/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div
                onClick={() => handleSelectAll(!allSelected)}
                className="cursor-pointer flex items-center space-x-2"
              >
                {allSelected ? (
                  <CheckSquare className="h-5 w-5 text-blue-400" />
                ) : partialSelected ? (
                  <div className="h-5 w-5 border-2 border-blue-400 rounded bg-blue-500/50 flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-sm"></div>
                  </div>
                ) : (
                  <Square className="h-5 w-5 text-white/70 hover:text-blue-400" />
                )}
                <span className="text-white/90 font-medium">
                  {selectedCount > 0 ? `${selectedCount} selected` : 'Select all'}
                </span>
              </div>
            </div>
            
            {selectedCount > 0 && (
              <div className="text-white/70">
                of {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Bulk Action Controls */}
          {selectedCount > 0 && (
            <div className="flex items-center space-x-3">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-2 bg-black/50 border border-blue-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Choose action...</option>
                <option value="confirm">Confirm Appointments</option>
                <option value="reschedule">Reschedule All</option>
                <option value="send-reminders">Send Reminders</option>
                <option value="mark-completed">Mark Completed</option>
                <option value="cancel">Cancel Selected</option>
                <option value="export">Export Data</option>
                <option value="print-schedule">Print Schedule</option>
              </select>
              
              <Button
                onClick={() => setShowConfirmation(true)}
                disabled={!bulkAction || processing}
                className="glass-btn-primary hover:glow-blue text-white px-4 py-2"
              >
                {processing ? 'Processing...' : 'Apply'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Appointments List */}
      <div className="p-6">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {appointments.map((appointment) => {
            const isSelected = selectedAppointments.has(appointment.id);
            
            return (
              <div
                key={appointment.id}
                className={`p-4 border rounded-xl transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-blue-400 bg-blue-500/10' 
                    : 'border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/5'
                }`}
                onClick={() => handleSelectAppointment(appointment.id, !isSelected)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-blue-400" />
                    ) : (
                      <Square className="h-5 w-5 text-white/70" />
                    )}
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="font-semibold text-white">{appointment.customerName}</p>
                      <p className="text-xs text-white/70">{appointment.type}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span className="text-white/90 text-sm">
                        {new Date(appointment.date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <span className="text-white/90 text-sm">{appointment.time}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${
                        appointment.status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-300' :
                        appointment.status === 'confirmed' ? 'bg-blue-500/20 text-blue-300' :
                        appointment.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {appointment.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {appointments.length === 0 && (
          <div className="text-center py-12 text-white/60">
            <Users className="h-16 w-16 mx-auto mb-4" />
            <p className="text-lg">No appointments to manage</p>
            <p className="text-sm">Appointments will appear here for bulk operations</p>
          </div>
        )}
      </div>

      {/* Bulk Action Confirmation Modal */}
      {showConfirmation && bulkAction && selectedCount > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="glass rounded-xl border border-blue-400 p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Confirm Bulk Action</h3>
              <p className="text-white/90">
                Are you sure you want to {getActionDescription(bulkAction).toLowerCase()} for{' '}
                <span className="font-bold text-blue-300">{selectedCount}</span> appointment{selectedCount !== 1 ? 's' : ''}?
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="ghost"
                onClick={() => setShowConfirmation(false)}
                className="flex-1 text-white/80 hover:text-white"
                disabled={processing}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={executeBulkAction}
                disabled={processing}
                className="flex-1 glass-btn-primary hover:glow-blue text-white"
              >
                {processing ? (
                  'Processing...'
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}