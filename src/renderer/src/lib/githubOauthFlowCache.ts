import type { GithubOauthDeviceStartCreateData } from '../api/generated/data-contracts';

const OAUTH_FLOW_CACHE_KEY = 'qode.github.oauth.flow';
const OAUTH_FLOW_CACHE_TTL_MS = 10 * 60 * 1000;

type CachedOauthFlow = {
  savedAt: number;
  flow: GithubOauthDeviceStartCreateData;
};

export const saveCachedOauthFlow = (flow: GithubOauthDeviceStartCreateData): void => {
  try {
    const payload: CachedOauthFlow = { savedAt: Date.now(), flow };
    localStorage.setItem(OAUTH_FLOW_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // noop
  }
};

export const clearCachedOauthFlow = (): void => {
  try {
    localStorage.removeItem(OAUTH_FLOW_CACHE_KEY);
  } catch {
    // noop
  }
};

export const readCachedOauthFlow = (): GithubOauthDeviceStartCreateData | null => {
  try {
    const raw = localStorage.getItem(OAUTH_FLOW_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedOauthFlow;
    if (!parsed?.flow?.data?.flowId || !parsed.savedAt) {
      clearCachedOauthFlow();
      return null;
    }
    if (Date.now() - parsed.savedAt > OAUTH_FLOW_CACHE_TTL_MS) {
      clearCachedOauthFlow();
      return null;
    }
    return parsed.flow;
  } catch {
    return null;
  }
};
