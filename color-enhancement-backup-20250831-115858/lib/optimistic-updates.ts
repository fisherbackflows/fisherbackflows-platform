// Ultra-fast optimistic updates for instant UI feedback
import { useState, useCallback } from 'react';

export function useOptimisticUpdate<T>(
  initial: T,
  updateFn: (data: T) => Promise<T>
) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);

  const optimisticUpdate = useCallback(
    async (optimisticData: T) => {
      // Immediately update UI
      setData(optimisticData);
      setLoading(true);

      try {
        // Perform actual update
        const result = await updateFn(optimisticData);
        setData(result);
      } catch (error) {
        // Rollback on error
        setData(initial);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [initial, updateFn]
  );

  return { data, loading, optimisticUpdate };
}

// Fast appointment scheduling with instant feedback
export function useScheduleOptimistic() {
  return useOptimisticUpdate(
    { appointments: [], loading: false },
    async (newData) => {
      // API call happens in background
      const response = await fetch('/api/appointments', {
        method: 'POST',
        body: JSON.stringify(newData),
      });
      return response.json();
    }
  );
}