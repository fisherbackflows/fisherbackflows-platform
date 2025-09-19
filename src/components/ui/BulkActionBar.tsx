'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  Download, 
  Archive, 
  Edit, 
  Send, 
  Check, 
  X, 
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  confirmationRequired?: boolean;
  confirmationText?: string;
  action: (selectedIds: string[]) => Promise<void> | void;
}

interface BulkActionBarProps {
  selectedItems: string[];
  totalItems: number;
  actions: BulkAction[];
  onClearSelection: () => void;
  loading?: boolean;
  className?: string;
}

export function BulkActionBar({ 
  selectedItems, 
  totalItems, 
  actions, 
  onClearSelection,
  loading = false,
  className = '' 
}: BulkActionBarProps) {
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [executingAction, setExecutingAction] = useState<string | null>(null);

  if (selectedItems.length === 0) return null;

  const handleAction = async (action: BulkAction) => {
    if (action.confirmationRequired) {
      setShowConfirmation(action.id);
      return;
    }
    
    await executeAction(action);
  };

  const executeAction = async (action: BulkAction) => {
    try {
      setExecutingAction(action.id);
      await action.action(selectedItems);
      onClearSelection(); // Clear selection after successful action
    } catch (error: unknown) {
      console.error(`Bulk action ${action.id} failed:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to ${action.label.toLowerCase()}: ${errorMessage}`);
    } finally {
      setExecutingAction(null);
      setShowConfirmation(null);
    }
  };

  const confirmAction = () => {
    const action = actions.find(a => a.id === showConfirmation);
    if (action) {
      executeAction(action);
    }
  };

  // Split actions into primary and secondary
  const primaryActions = actions.slice(0, 3);
  const secondaryActions = actions.slice(3);

  return (
    <>
      <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 ${className}`}>
        <div className="glass rounded-2xl border border-blue-400 glow-blue-sm p-4">
          <div className="flex items-center space-x-4">
            {/* Selection info */}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-medium">
                {selectedItems.length} of {totalItems} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="h-6 w-6 p-0 text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-blue-400/50" />

            {/* Primary actions */}
            <div className="flex items-center space-x-2">
              {primaryActions.map(action => {
                const Icon = action.icon;
                const isExecuting = executingAction === action.id;
                
                return (
                  <Button
                    key={action.id}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={() => handleAction(action)}
                    disabled={loading || isExecuting}
                    className="h-8"
                  >
                    <Icon className={`h-4 w-4 mr-1 ${isExecuting ? 'animate-spin' : ''}`} />
                    {action.label}
                  </Button>
                );
              })}

              {/* More actions dropdown */}
              {secondaryActions.length > 0 && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMoreActions(!showMoreActions)}
                    className="h-8"
                  >
                    <MoreHorizontal className="h-4 w-4 mr-1" />
                    More
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>

                  {showMoreActions && (
                    <div className="absolute bottom-full mb-2 right-0 glass border border-blue-400 rounded-xl p-2 min-w-48">
                      {secondaryActions.map(action => {
                        const Icon = action.icon;
                        const isExecuting = executingAction === action.id;
                        
                        return (
                          <button
                            key={action.id}
                            onClick={() => {
                              handleAction(action);
                              setShowMoreActions(false);
                            }}
                            disabled={loading || isExecuting}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-left text-white hover:bg-blue-500/20 rounded-lg transition-colors"
                          >
                            <Icon className={`h-4 w-4 ${isExecuting ? 'animate-spin' : ''}`} />
                            <span>{action.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass border border-blue-400 glow-blue-sm rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-2">Confirm Action</h3>
            <p className="text-white/80 mb-4">
              {actions.find(a => a.id === showConfirmation)?.confirmationText || 
               `Are you sure you want to ${actions.find(a => a.id === showConfirmation)?.label.toLowerCase()} ${selectedItems.length} items?`}
            </p>
            <p className="text-sm text-white/60 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={confirmAction}
                variant="destructive"
                disabled={executingAction !== null}
                className="flex-1"
              >
                {executingAction === showConfirmation ? 'Processing...' : 'Confirm'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(null)}
                disabled={executingAction !== null}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Bulk selection hook for managing selection state
export function useBulkSelection<T>(items: T[], getId: (item: T) => string = (item: any) => item.id) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isSelected = (item: T) => selectedIds.includes(getId(item));
  const isAllSelected = items.length > 0 && selectedIds.length === items.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < items.length;

  const toggleItem = (item: T) => {
    const id = getId(item);
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedIds(prev => 
      prev.length === items.length 
        ? []
        : items.map(getId)
    );
  };

  const clearSelection = () => setSelectedIds([]);

  const getSelectedItems = () => items.filter(item => selectedIds.includes(getId(item)));

  return {
    selectedIds,
    isSelected,
    isAllSelected,
    isPartiallySelected,
    toggleItem,
    toggleAll,
    clearSelection,
    getSelectedItems,
    selectedCount: selectedIds.length
  };
}

// Common bulk actions
export const commonBulkActions = {
  delete: (onDelete: (ids: string[]) => Promise<void>): BulkAction => ({
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    variant: 'destructive' as const,
    confirmationRequired: true,
    confirmationText: 'Are you sure you want to delete these items? This action cannot be undone.',
    action: onDelete
  }),

  export: (onExport: (ids: string[]) => Promise<void>): BulkAction => ({
    id: 'export',
    label: 'Export',
    icon: Download,
    variant: 'outline' as const,
    action: onExport
  }),

  archive: (onArchive: (ids: string[]) => Promise<void>): BulkAction => ({
    id: 'archive',
    label: 'Archive',
    icon: Archive,
    variant: 'secondary' as const,
    confirmationRequired: true,
    action: onArchive
  }),

  edit: (onEdit: (ids: string[]) => Promise<void>): BulkAction => ({
    id: 'edit',
    label: 'Edit',
    icon: Edit,
    variant: 'outline' as const,
    action: onEdit
  }),

  send: (onSend: (ids: string[]) => Promise<void>): BulkAction => ({
    id: 'send',
    label: 'Send',
    icon: Send,
    variant: 'default' as const,
    action: onSend
  })
};