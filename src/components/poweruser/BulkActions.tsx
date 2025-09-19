'use client';

import { useState } from 'react';
import {
  Check,
  X,
  Trash2,
  Mail,
  UserX,
  UserCheck,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';

interface BulkAction {
  id: string;
  label: string;
  icon: any;
  color: string;
  action: (selectedIds: string[]) => void;
  requiresConfirmation?: boolean;
  destructive?: boolean;
}

interface BulkActionsProps {
  selectedItems: string[];
  totalItems: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  itemType: 'employees' | 'customers' | 'appointments' | 'invoices';
  customActions?: BulkAction[];
}

export default function BulkActions({
  selectedItems,
  totalItems,
  onSelectAll,
  onDeselectAll,
  itemType,
  customActions = []
}: BulkActionsProps) {
  const [showActions, setShowActions] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState<string | null>(null);

  const defaultActions: Record<string, BulkAction[]> = {
    employees: [
      {
        id: 'resend-invitations',
        label: 'Resend Invitations',
        icon: Mail,
        color: 'text-blue-600',
        action: (ids) => console.log('Resending invitations to:', ids)
      },
      {
        id: 'deactivate',
        label: 'Deactivate Users',
        icon: UserX,
        color: 'text-orange-600',
        action: (ids) => console.log('Deactivating users:', ids),
        requiresConfirmation: true
      },
      {
        id: 'activate',
        label: 'Activate Users',
        icon: UserCheck,
        color: 'text-green-600',
        action: (ids) => console.log('Activating users:', ids)
      },
      {
        id: 'delete',
        label: 'Delete Users',
        icon: Trash2,
        color: 'text-red-600',
        action: (ids) => console.log('Deleting users:', ids),
        requiresConfirmation: true,
        destructive: true
      }
    ],
    customers: [
      {
        id: 'export',
        label: 'Export Data',
        icon: Mail,
        color: 'text-blue-600',
        action: (ids) => console.log('Exporting customers:', ids)
      },
      {
        id: 'archive',
        label: 'Archive Customers',
        icon: UserX,
        color: 'text-orange-600',
        action: (ids) => console.log('Archiving customers:', ids),
        requiresConfirmation: true
      }
    ],
    appointments: [
      {
        id: 'reschedule',
        label: 'Bulk Reschedule',
        icon: Mail,
        color: 'text-blue-600',
        action: (ids) => console.log('Rescheduling appointments:', ids)
      },
      {
        id: 'cancel',
        label: 'Cancel Appointments',
        icon: X,
        color: 'text-red-600',
        action: (ids) => console.log('Cancelling appointments:', ids),
        requiresConfirmation: true,
        destructive: true
      }
    ],
    invoices: [
      {
        id: 'send',
        label: 'Send Invoices',
        icon: Mail,
        color: 'text-blue-600',
        action: (ids) => console.log('Sending invoices:', ids)
      },
      {
        id: 'mark-paid',
        label: 'Mark as Paid',
        icon: Check,
        color: 'text-green-600',
        action: (ids) => console.log('Marking as paid:', ids)
      }
    ]
  };

  const availableActions = [...(defaultActions[itemType] || []), ...customActions];

  const handleActionClick = (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setConfirmingAction(action.id);
    } else {
      action.action(selectedItems);
      setShowActions(false);
    }
  };

  const confirmAction = () => {
    const action = availableActions.find(a => a.id === confirmingAction);
    if (action) {
      action.action(selectedItems);
    }
    setConfirmingAction(null);
    setShowActions(false);
  };

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <>
      {/* Bulk Actions Bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 px-6 py-4 flex items-center space-x-4">
          {/* Selection Info */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium">
                {selectedItems.length} of {totalItems} selected
              </span>
            </div>

            {/* Select All / Deselect All */}
            <div className="h-4 w-px bg-slate-600"></div>
            <button
              onClick={selectedItems.length === totalItems ? onDeselectAll : onSelectAll}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              {selectedItems.length === totalItems ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Actions */}
          <div className="h-4 w-px bg-slate-600"></div>
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span>Actions</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {showActions && (
              <div className="absolute bottom-full mb-2 left-0 bg-white rounded-xl shadow-xl border border-slate-200 py-2 min-w-48">
                {availableActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleActionClick(action)}
                      className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-slate-50 transition-colors ${
                        action.destructive ? 'text-red-600' : action.color
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onDeselectAll}
            className="p-1 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Confirm Action
              </h3>
              <p className="text-slate-600 mb-4">
                Are you sure you want to {availableActions.find(a => a.id === confirmingAction)?.label.toLowerCase()} {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}?
                {availableActions.find(a => a.id === confirmingAction)?.destructive && (
                  <span className="block mt-2 text-red-600 font-medium">
                    This action cannot be undone.
                  </span>
                )}
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setConfirmingAction(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className={`px-4 py-2 rounded-lg font-medium text-white ${
                    availableActions.find(a => a.id === confirmingAction)?.destructive
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}