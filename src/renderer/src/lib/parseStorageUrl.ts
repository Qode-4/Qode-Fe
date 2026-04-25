import type {
  FigjamMetadata,
  FigmaMetadata,
  GithubRepoMetadata,
  StorageItemType
} from '../api/contracts/storageItems';

export type ParsedStorageUrl =
  | { type: 'github_repo'; url: string; metadata: GithubRepoMetadata }
  | { type: 'figma'; url: string; metadata: FigmaMetadata }
  | { type: 'figjam'; url: string; metadata: FigjamMetadata };

const trimTrailingSlash = (s: string): string => s.replace(/\/$/, '');

const parseGithub = (url: string): ParsedStorageUrl | null => {
  const m = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)\/?$/);
  if (!m) return null;
  const [, owner, repo] = m;
  if (!owner || !repo) return null;
  return {
    type: 'github_repo',
    url: trimTrailingSlash(url),
    metadata: { owner, repo, defaultBranch: 'main' }
  };
};

const parseFigma = (url: string): ParsedStorageUrl | null => {
  const m = url.match(/figma\.com\/design\/([A-Za-z0-9]+)/);
  if (!m) return null;
  const fileKey = m[1]!;
  const nodeIdMatch = url.match(/[?&]node-id=([^&]+)/);
  const metadata: FigmaMetadata = { fileKey };
  if (nodeIdMatch) {
    metadata.nodeId = decodeURIComponent(nodeIdMatch[1]!).replace('-', ':');
  }
  return { type: 'figma', url, metadata };
};

const parseFigjam = (url: string): ParsedStorageUrl | null => {
  const m = url.match(/figma\.com\/board\/([A-Za-z0-9]+)/);
  if (!m) return null;
  return { type: 'figjam', url, metadata: { fileKey: m[1]! } };
};

const PARSERS: Record<StorageItemType, (url: string) => ParsedStorageUrl | null> = {
  github_repo: parseGithub,
  figma: parseFigma,
  figjam: parseFigjam
};

export const parseStorageUrl = (type: StorageItemType, url: string): ParsedStorageUrl | null => {
  const trimmed = url.trim();
  if (!trimmed) return null;
  return PARSERS[type](trimmed);
};
