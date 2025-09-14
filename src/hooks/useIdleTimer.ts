import { useEffect, useRef, useCallback } from 'react';

interface UseIdleTimerProps {
  timeout: number; // in milliseconds
  onIdle: () => void;
  onActive?: () => void;
  events?: string[];
  startOnLoad?: boolean;
  stopOnIdle?: boolean;
}

export const useIdleTimer = ({
  timeout,
  onIdle,
  onActive,
  events = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'keydown'
  ],
  startOnLoad = true,
  stopOnIdle = false
}: UseIdleTimerProps) => {
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const isIdleRef = useRef(false);
  const eventHandlerRef = useRef<(() => void) | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const handleIdle = useCallback(() => {
    if (!isIdleRef.current) {
      isIdleRef.current = true;
      onIdle();

      if (stopOnIdle) {
        events.forEach(event => {
          document.removeEventListener(event, eventHandlerRef.current!);
        });
      }
    }
  }, [onIdle, stopOnIdle, events]);

  const handleActive = useCallback(() => {
    if (isIdleRef.current) {
      isIdleRef.current = false;
      onActive?.();
    }

    clearTimer();
    timeoutIdRef.current = setTimeout(handleIdle, timeout);
  }, [onActive, clearTimer, handleIdle, timeout]);

  const start = useCallback(() => {
    clearTimer();
    isIdleRef.current = false;

    eventHandlerRef.current = handleActive;
    events.forEach(event => {
      document.addEventListener(event, handleActive, { passive: true });
    });

    timeoutIdRef.current = setTimeout(handleIdle, timeout);
  }, [events, handleActive, handleIdle, timeout, clearTimer]);

  const stop = useCallback(() => {
    clearTimer();

    if (eventHandlerRef.current) {
      events.forEach(event => {
        document.removeEventListener(event, eventHandlerRef.current!);
      });
    }
  }, [events, clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    isIdleRef.current = false;
    timeoutIdRef.current = setTimeout(handleIdle, timeout);
  }, [clearTimer, handleIdle, timeout]);

  useEffect(() => {
    if (startOnLoad) {
      start();
    }

    return () => {
      stop();
    };
  }, [start, stop, startOnLoad]);

  return {
    start,
    stop,
    reset,
    isIdle: () => isIdleRef.current
  };
};