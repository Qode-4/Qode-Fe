/** 참조 소스 한 건. 서버 SourceItem 에서 목록 표시에 필요한 필드만. */
export type SourceRef = {
  filePath: string;
  startLine?: number | null;
  endLine?: number | null;
};

export type LineRange = { start: number | null; end: number | null };

export type SourceGroup = {
  filePath: string;
  /** 경로의 마지막 조각. 경로가 비었으면 빈 문자열. */
  fileName: string;
  /** 파일명을 뺀 폴더 경로. 루트 파일이면 빈 문자열. */
  dir: string;
  /** 시작 줄 오름차순, 완전히 같은 범위만 하나로 합친다. 겹치는 범위는 AI 가 인용한 그대로 둔다. */
  ranges: LineRange[];
};

const splitPath = (filePath: string): { fileName: string; dir: string } => {
  const normalized = filePath.replace(/\\/g, '/').replace(/\/+$/, '');
  const i = normalized.lastIndexOf('/');
  return i === -1
    ? { fileName: normalized, dir: '' }
    : { fileName: normalized.slice(i + 1), dir: normalized.slice(0, i) };
};

/** 같은 파일을 한 그룹으로 묶는다. 파일 순서는 처음 등장한 순서(서버 관련도 순)를 유지한다. */
export const groupSources = (sources: readonly SourceRef[]): SourceGroup[] => {
  const groups = new Map<string, SourceGroup>();
  for (const s of sources) {
    const key = s.filePath;
    let group = groups.get(key);
    if (!group) {
      group = { filePath: key, ...splitPath(key), ranges: [] };
      groups.set(key, group);
    }
    const start = s.startLine ?? null;
    const end = s.endLine ?? null;
    if (start === null && end === null) continue;
    if (!group.ranges.some((r) => r.start === start && r.end === end)) {
      group.ranges.push({ start, end });
    }
  }
  for (const g of groups.values()) {
    g.ranges.sort(
      (a, b) =>
        (a.start ?? Number.MAX_SAFE_INTEGER) - (b.start ?? Number.MAX_SAFE_INTEGER) ||
        (a.end ?? 0) - (b.end ?? 0)
    );
  }
  return [...groups.values()];
};

/** `12–40`, 한 줄이면 `12`, 한쪽만 있으면 있는 쪽만. */
export const formatRange = ({ start, end }: LineRange): string => {
  if (start !== null && end !== null) return start === end ? `${start}` : `${start}–${end}`;
  return `${start ?? end ?? ''}`;
};
