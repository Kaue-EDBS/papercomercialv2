import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/telemetry';

/**
 * (#9) Mede tempo gasto em cada slide/página e dispara evento ao trocar.
 */
export function usePageTracking(name: string, context?: Record<string, unknown>) {
  const startRef = useRef<number>(Date.now());
  useEffect(() => {
    startRef.current = Date.now();
    trackEvent('page_view', { name, ...context });
    return () => {
      const dwellMs = Date.now() - startRef.current;
      trackEvent('page_leave', { name, dwellMs, ...context });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
}