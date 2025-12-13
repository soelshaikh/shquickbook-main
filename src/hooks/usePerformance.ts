import { useEffect, useRef, useCallback } from 'react';
import { logPageLoad, logInteraction } from '@/lib/performance';

export const usePagePerformance = (pageName: string): void => {
  const startTimeRef = useRef<number>(performance.now());
  const hasLoggedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!hasLoggedRef.current) {
      logPageLoad(pageName, startTimeRef.current);
      hasLoggedRef.current = true;
    }
  }, [pageName]);
};

export const useActionPerformance = () => {
  const measureAction = useCallback(
    <T>(actionName: string, fn: () => T): T => {
      const start = performance.now();
      const result = fn();
      const duration = performance.now() - start;
      logInteraction(actionName, duration);
      return result;
    },
    []
  );

  const measureAsyncAction = useCallback(
    async <T>(actionName: string, fn: () => Promise<T>): Promise<T> => {
      const start = performance.now();
      try {
        const result = await fn();
        const duration = performance.now() - start;
        logInteraction(actionName, duration);
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        logInteraction(`${actionName} (error)`, duration);
        throw error;
      }
    },
    []
  );

  return { measureAction, measureAsyncAction };
};
