'use client';

import { useState, useCallback, useMemo } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface UseUnifiedLoadingReturn {
  isLoading: (key?: string) => boolean;
  isAnyLoading: boolean;
  startLoading: (key?: string) => void;
  stopLoading: (key?: string) => void;
  toggleLoading: (key?: string) => void;
  withLoading: <T>(
    fn: () => Promise<T>,
    key?: string
  ) => Promise<T>;
  loadingStates: LoadingState;
}

const DEFAULT_KEY = 'default';

export function useUnifiedLoading(): UseUnifiedLoadingReturn {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const isLoading = useCallback((key: string = DEFAULT_KEY): boolean => {
    return Boolean(loadingStates[key]);
  }, [loadingStates]);

  const isAnyLoading = useMemo(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const startLoading = useCallback((key: string = DEFAULT_KEY) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: true
    }));
  }, []);

  const stopLoading = useCallback((key: string = DEFAULT_KEY) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  const toggleLoading = useCallback((key: string = DEFAULT_KEY) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const withLoading = useCallback(async <T>(
    fn: () => Promise<T>,
    key: string = DEFAULT_KEY
  ): Promise<T> => {
    try {
      startLoading(key);
      return await fn();
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    isAnyLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    withLoading,
    loadingStates
  };
}

export default useUnifiedLoading;