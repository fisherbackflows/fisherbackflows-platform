'use client';

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    shortcuts.forEach(shortcut => {
      const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const matchesCtrl = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const matchesShift = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const matchesAlt = shortcut.alt ? event.altKey : !event.altKey;
      
      if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.action();
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Common shortcuts for forms
export const createFormShortcuts = (
  onSave?: () => void,
  onSubmit?: () => void,
  onCancel?: () => void
): KeyboardShortcut[] => [
  ...(onSave ? [{
    key: 's',
    ctrl: true,
    action: onSave,
    description: 'Save form'
  }] : []),
  ...(onSubmit ? [{
    key: 'Enter',
    ctrl: true,
    action: onSubmit,
    description: 'Submit form'
  }] : []),
  ...(onCancel ? [{
    key: 'Escape',
    action: onCancel,
    description: 'Cancel/Close'
  }] : [])
];

// Common shortcuts for navigation
export const createNavigationShortcuts = (
  onNew?: () => void,
  onSearch?: () => void
): KeyboardShortcut[] => [
  ...(onNew ? [{
    key: 'n',
    ctrl: true,
    action: onNew,
    description: 'Create new item'
  }] : []),
  ...(onSearch ? [{
    key: 'f',
    ctrl: true,
    action: onSearch,
    description: 'Focus search'
  }] : [])
];