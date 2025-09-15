import { useRef, useEffect, useCallback } from 'react';

interface UsePollingOptions {
  interval: number;
  enabled: boolean;
  onError?: (error: Error) => void;
}

export function usePolling(
  callback: () => Promise<void> | void,
  { interval, enabled, onError }: UsePollingOptions
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(async () => {
      try {
        await callbackRef.current();
      } catch (error) {
        onError?.(error as Error);
      }
    }, interval);
  }, [interval, onError]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [enabled, startPolling, stopPolling]);

  return { startPolling, stopPolling };
}