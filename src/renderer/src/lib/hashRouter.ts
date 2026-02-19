export type RouteLocation = {
  path: string;
  query: Record<string, string>;
};

const parseQuery = (search: string): Record<string, string> => {
  const out: Record<string, string> = {};
  const q = search.startsWith('?') ? search.slice(1) : search;
  if (!q) return out;
  for (const part of q.split('&')) {
    if (!part) continue;
    const [k, v] = part.split('=');
    if (!k) continue;
    out[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
  }
  return out;
};

export const getHashLocation = (): RouteLocation => {
  const raw = window.location.hash || '#/';
  const hash = raw.startsWith('#') ? raw.slice(1) : raw;
  const [pathname, search = ''] = hash.split('?');
  const path = pathname?.startsWith('/') ? pathname : `/${pathname ?? ''}`;
  return { path, query: parseQuery(search) };
};

export const navigate = (to: string, opts?: { replace?: boolean }): void => {
  const next = to.startsWith('#') ? to : `#${to.startsWith('/') ? to : `/${to}`}`;
  if (opts?.replace) window.location.replace(next);
  else window.location.hash = next.slice(1);
};

export const buildPath = (path: string, query?: Record<string, string | undefined>): string => {
  const q = query
    ? Object.entries(query)
        .filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  return q ? `${path}?${q}` : path;
};

export const resolveNextPath = (next: string | undefined, fallback = '/projects'): string => {
  if (!next || !next.startsWith('/')) return fallback;

  const [path] = next.split('?');
  if (!path) return fallback;

  if (path === '/login' || path === '/signup') return fallback;
  return next;
};

export const matchPath = (
  current: string,
  pattern: string
): { matched: boolean; params: Record<string, string> } => {
  const cur = current.split('/').filter(Boolean);
  const pat = pattern.split('/').filter(Boolean);

  if (cur.length !== pat.length) return { matched: false, params: {} };

  const params: Record<string, string> = {};
  for (let i = 0; i < pat.length; i += 1) {
    const p = pat[i]!;
    const c = cur[i]!;
    if (p.startsWith(':')) params[p.slice(1)] = decodeURIComponent(c);
    else if (p !== c) return { matched: false, params: {} };
  }

  return { matched: true, params };
};
