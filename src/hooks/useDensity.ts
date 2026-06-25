import { useCallback, useEffect, useState } from 'react';

export type Density = 'compact' | 'comfortable';

const STORAGE_KEY = 'ui.density';

const readInitial = (): Density => {
  if (typeof window === 'undefined') return 'comfortable';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'compact' || v === 'comfortable' ? v : 'comfortable';
};

export function useDensity() {
  const [density, setDensityState] = useState<Density>(readInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, density);
    } catch {
      /* ignore */
    }
  }, [density]);

  // Cross-tab / cross-component sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'compact' || e.newValue === 'comfortable')) {
        setDensityState(e.newValue);
      }
    };
    const custom = (e: Event) => {
      const detail = (e as CustomEvent<Density>).detail;
      if (detail === 'compact' || detail === 'comfortable') setDensityState(detail);
    };
    window.addEventListener('storage', handler);
    window.addEventListener('ui-density-change', custom as EventListener);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('ui-density-change', custom as EventListener);
    };
  }, []);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
    window.dispatchEvent(new CustomEvent('ui-density-change', { detail: d }));
  }, []);

  const toggle = useCallback(() => {
    setDensity(density === 'compact' ? 'comfortable' : 'compact');
  }, [density, setDensity]);

  return { density, setDensity, toggle };
}

export const densityClasses = (density: Density) => ({
  rowPaddingY: density === 'compact' ? 'py-1.5' : 'py-3',
  cellPaddingX: density === 'compact' ? 'px-2' : 'px-4',
  cardPadding: density === 'compact' ? 'p-2.5' : 'p-4',
  textSize: density === 'compact' ? 'text-xs' : 'text-sm',
  headingSize: density === 'compact' ? 'text-sm' : 'text-base',
  gap: density === 'compact' ? 'gap-1.5' : 'gap-3',
});
