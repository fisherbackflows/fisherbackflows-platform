'use client';

import { FileText } from 'lucide-react';
import { RecoveryNotificationProps, AutoSaveStatusProps } from '@/hooks/useAutoSave';

// Recovery notification component
export function RecoveryNotification({ 
  show, 
  onRecover, 
  onDiscard, 
  formName = 'form' 
}: RecoveryNotificationProps) {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 glass border border-blue-400 glow-blue-sm rounded-2xl p-4 max-w-sm">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-blue-500/20 rounded-xl">
          <FileText className="h-5 w-5 text-blue-300" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-white">Recover Saved Data</h4>
          <p className="text-sm text-white/80 mt-1">
            We found a saved version of your {formName}. Would you like to recover it?
          </p>
          <div className="flex space-x-2 mt-3">
            <button
              onClick={onRecover}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
            >
              Recover
            </button>
            <button
              onClick={onDiscard}
              className="px-3 py-1 text-white/80 text-sm hover:text-white transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Auto-save status indicator
export function AutoSaveStatus({ lastSaved, saving = false, className = '' }: AutoSaveStatusProps) {
  if (!lastSaved && !saving) return null;

  return (
    <div className={`flex items-center space-x-1 text-xs text-white/60 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${saving ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
      <span>
        {saving ? 'Saving...' : `Saved ${lastSaved?.toLocaleTimeString()}`}
      </span>
    </div>
  );
}