import { useEffect, useState } from 'react';
import { getHashLocation, type RouteLocation } from './hashRouter';

export const useHashLocation = (): RouteLocation => {
  const [loc, setLoc] = useState<RouteLocation>(() => getHashLocation());

  useEffect(() => {
    const onChange = (): void => setLoc(getHashLocation());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return loc;
};
