'use client';

import { useEffect, useRef, useCallback } from 'react';
import { FileText } from 'lucide-react';

export interface AutoSaveConfig {
  key: string;
  interval?: number; // milliseconds, default 30 seconds
  storage?: 'localStorage' | 'sessionStorage';
  onSave?: (data: any) => void;
  onRecover?: (data: any) => void;
  enabled?: boolean;
}

export interface AutoSaveReturn<T> {
  saveNow: () => void;
  clearSave: () => void;
  recoverData: () => T | null;
  hasSavedData: boolean;
  lastSaved: Date | null;
}

export function useAutoSave<T>(
  data: T,
  config: AutoSaveConfig
): AutoSaveReturn<T> {
  const {
    key,
    interval = 30000, // 30 seconds default
    storage = 'localStorage',
    onSave,
    onRecover,
    enabled = true
  } = config;

  const lastSavedData = useRef<string>('');
  const lastSavedTime = useRef<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get storage object
  const storageObj = typeof window !== 'undefined' 
    ? (storage === 'localStorage' ? localStorage : sessionStorage)
    : null;

  const saveKey = `autosave_${key}`;

  // Save data function
  const saveNow = useCallback(() => {
    if (!enabled || !storageObj || !data) return;

    try {
      const serializedData = JSON.stringify(data);
      
      // Only save if data has changed
      if (serializedData !== lastSavedData.current) {
        const savePayload = {
          data,
          timestamp: Date.now(),
          version: '1.0'
        };

        storageObj.setItem(saveKey, JSON.stringify(savePayload));
        lastSavedData.current = serializedData;
        lastSavedTime.current = new Date();

        if (onSave) {
          onSave(data);
        }

        console.log(`💾 Auto-saved: ${key} at ${new Date().toLocaleTimeString()}`);
      }
    } catch (error) {
      console.warn('Auto-save failed:', error);
    }
  }, [data, enabled, storageObj, saveKey, onSave, key]);

  // Clear saved data
  const clearSave = useCallback(() => {
    if (storageObj) {
      storageObj.removeItem(saveKey);
      lastSavedData.current = '';
      lastSavedTime.current = null;
    }
  }, [storageObj, saveKey]);

  // Recover saved data
  const recoverData = useCallback((): T | null => {
    if (!storageObj) return null;

    try {
      const savedData = storageObj.getItem(saveKey);
      if (!savedData) return null;

      const parsed = JSON.parse(savedData);
      
      // Check if data is recent (within last 24 hours)
      const saveTime = new Date(parsed.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - saveTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        clearSave();
        return null;
      }

      if (onRecover) {
        onRecover(parsed.data);
      }

      return parsed.data;
    } catch (error) {
      console.warn('Failed to recover auto-save data:', error);
      return null;
    }
  }, [storageObj, saveKey, onRecover, clearSave]);

  // Check if there's saved data
  const hasSavedData = useCallback(() => {
    if (!storageObj) return false;
    return storageObj.getItem(saveKey) !== null;
  }, [storageObj, saveKey]);

  // Auto-save interval effect
  useEffect(() => {
    if (!enabled || !data) return;

    intervalRef.current = setInterval(saveNow, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [data, enabled, interval, saveNow]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveNow();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveNow]);

  return {
    saveNow,
    clearSave,
    recoverData,
    hasSavedData: hasSavedData(),
    lastSaved: lastSavedTime.current
  };
}

// Recovery notification component
export interface RecoveryNotificationProps {
  show: boolean;
  onRecover: () => void;
  onDiscard: () => void;
  formName?: string;
}

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
export interface AutoSaveStatusProps {
  lastSaved: Date | null;
  saving?: boolean;
  className?: string;
}

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