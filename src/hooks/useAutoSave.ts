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

// Types for external components
export interface RecoveryNotificationProps {
  show: boolean;
  onRecover: () => void;
  onDiscard: () => void;
  formName?: string;
}

export interface AutoSaveStatusProps {
  lastSaved: Date | null;
  saving?: boolean;
  className?: string;
}