import { useCallback, useSyncExternalStore } from 'react';

// sm(640) 미만을 모바일로 취급. Tailwind 기본 sm 브레이크와 정확히 맞물리도록
// 소수점으로 경계를 잘라 데스크톱 정의역과 겹치지 않게 한다.
const MOBILE_MEDIA_QUERY = '(max-width: 639.98px)';

const getServerSnapshot = (): boolean => false;

export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query]
  );

  const getSnapshot = useCallback((): boolean => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

export const useIsMobile = (): boolean => useMediaQuery(MOBILE_MEDIA_QUERY);
