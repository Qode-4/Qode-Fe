import type { SourceItem } from '../api/contracts/chats';

// AI 가 본문에 남긴 참조 메타데이터를 뽑아 SourceItem 으로 변환하고 원문에서는 제거한다.
// 서버가 sources 배열을 안 채워주는 흐름에서도 카드가 뜨도록 한 프론트엔드 폴백이며,
// 답변 본문에 같은 정보가 여러 번 반복되는 것을 방지한다.
//
// 지원 패턴 (모두 뽑아서 소스 카드로 옮기고 본문에서는 제거):
//   1) 괄호 인라인:       "(참고: `src/x.ts` 1-17)" · "(참조: src/x.ts 1-17)"
//                         "(apis/services/x.ts L101-116)" (참고 프리픽스 없어도)
//                         "(components/y.tsx L62-93 주석 참고)"
//   2) 파일 + 괄호 범위:  "components/youtube-player.tsx (L62-93)" · "utils/x.ts (L1-33, L28-58)"
//   3) 파일 + 공백 범위:  "apis/services/x.ts L101-116"
//   4) 메타 bullet 쌍:    "- **파일 경로**: `src/x.ts`\n- **라인 범위**: 1-17"
//   5) 소스 리스트 헤더 + 없음 bullet: "관련 파일: \n- 없음"

const PATH_TOKEN = '[a-zA-Z0-9_./-]+\\.[a-zA-Z0-9]{1,6}';

// 1) 괄호 인라인. "참고:" 프리픽스는 선택. 숫자 뒤 잔여 텍스트 허용.
const INLINE_SOURCE_REGEX = new RegExp(
  `\\s*\\(\\s*(?:참[고조]\\s*:\\s*)?\`?(${PATH_TOKEN})\`?[\\s,]+L?(\\d+)\\s*[-–~]\\s*(\\d+)[^)]*\\)`,
  'g'
);

// 2) 파일 + 괄호 범위. "components/y.tsx (L62-93)" 형태.
//    괄호 안에 여러 range 가 있어도 첫 range 만 대표로 뽑는다.
const PATH_PAREN_RANGE_REGEX = new RegExp(
  `\\s*\`?(${PATH_TOKEN})\`?\\s*\\(L?(\\d+)\\s*[-–~]\\s*(\\d+)[^)]*\\)`,
  'g'
);

// 3) 파일 + 공백 후 L range. "apis/services/x.ts L101-116"
const PATH_LINE_INLINE_REGEX = new RegExp(
  `\\s*\`?(${PATH_TOKEN})\`?\\s+L(\\d+)\\s*[-–~]\\s*(\\d+)`,
  'g'
);

// 4) 메타 bullet 쌍
const META_FILE_LINE_PAIR_REGEX =
  /^[\t ]*[-*•][\t ]*\**\s*(?:파일\s*(?:경로|이름|위치)|파일)\s*\**\s*:\s*`?([^\s`\n]+)`?[^\n]*\n[\t ]*[-*•][\t ]*\**\s*(?:라인\s*(?:범위|번호)?|줄\s*번호|위치|Line(?:s)?)\s*\**\s*:\s*`?(\d+)\s*[-–~]\s*(\d+)`?[^\n]*(?:\n|$)/gim;

// 5-a) 소스 리스트 섹션 헤더: "관련 파일:", "참고 파일 및 라인:", "관련 파일 및 라인:" 등
const SOURCE_LIST_HEADER_REGEX =
  /^[ \t]*(?:관련|참고|참조|Reference|References)[ \t]*(?:파일|코드|자료|위치|Source(?:s)?)(?:[ \t]*(?:및|,|and)[ \t]*(?:라인|줄|Line(?:s)?))?[ \t]*:[ \t]*\n?/gim;

// 5-b) "없음" 계열 bullet — 헤더가 지워진 뒤 남는 안내를 정리
const NO_SOURCE_BULLET_REGEX =
  /^[\t ]*[-*•][\t ]*(?:없음|해당\s*없음|N\/?A|(?:직접적인?\s*)?언급\s*없음|(?:전체\s*)?제공\s*(?:코드|내용)에서[^\n]*(?:없음|N\/?A))[^\n]*\n?/gim;

export const extractInlineSources = (
  content: string
): { content: string; sources: SourceItem[] } => {
  const sources: SourceItem[] = [];
  const push = (filePath: string, start: string, end: string): string => {
    sources.push({
      filePath: String(filePath),
      startLine: Number(start),
      endLine: Number(end),
      snippet: ''
    });
    return '';
  };

  let next = content;

  // 순서 중요: 구조적으로 큰 패턴 (메타 bullet 쌍, 괄호 파일, 괄호 인라인) 먼저.
  next = next.replace(META_FILE_LINE_PAIR_REGEX, (_m, f: string, s: string, e: string) =>
    push(f, s, e)
  );
  next = next.replace(INLINE_SOURCE_REGEX, (_m, f: string, s: string, e: string) => push(f, s, e));
  next = next.replace(PATH_PAREN_RANGE_REGEX, (_m, f: string, s: string, e: string) =>
    push(f, s, e)
  );
  next = next.replace(PATH_LINE_INLINE_REGEX, (_m, f: string, s: string, e: string) =>
    push(f, s, e)
  );

  // 소스 리스트 섹션 헤더와 "없음" 계열 bullet 정리
  next = next.replace(SOURCE_LIST_HEADER_REGEX, '');
  next = next.replace(NO_SOURCE_BULLET_REGEX, '');

  // 소스 references 만 있던 bullet 은 마커(-, *, •) 만 남는다. 고아 마커 라인은 정리한다.
  next = next.replace(/^[\t ]*[-*•][\t ]*(?=\n|$)/gm, '');

  // 연속된 공백 라인은 하나로, 라인 끝 공백도 정리
  const cleaned = next
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // 파싱 후 본문이 너무 짧으면 원문을 유지해 빈 카드 방지
  if (sources.length > 0 && cleaned.length < 10) {
    return { content: content.trim(), sources };
  }
  return { content: cleaned, sources };
};

export const mergeSources = (a: SourceItem[], b: SourceItem[]): SourceItem[] => {
  const seen = new Set<string>();
  const result: SourceItem[] = [];
  for (const src of [...a, ...b]) {
    const key = `${src.filePath}:${src.startLine ?? ''}-${src.endLine ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(src);
  }
  return result;
};

// ── 참조 전용 줄 ─────────────────────────────────────────────────────────
// 줄 전체가 참조만 담고 있을 때만 뽑아낸다. 문장 속 참조("이 목록은 x.ts (L1-29) 파일 내…")는 건드리지 않는다.
//   - "- package.json:L1-21"            · "- scripts/a.js (L3-23, L47-65)"
//   - "- 근거: types/ai-actions.ts:L1-29" · "참고: `src/x.ts` 1-17"
//   - 섹션: "## 근거 코드" / "참고 파일 및 라인:" 아래 bullet 이 전부 참조면 섹션째 제거

const LABEL =
  '(?:근거|참고|참조|관련|출처)(?:[ \\t]*(?:코드|파일|소스|자료|위치))?(?:[ \\t]*(?:및|,)[ \\t]*(?:라인|줄))?';
const BULLET_RE = /^[\t ]*(?:[-*•]|\d+[.)])[\t ]+/;
const LABEL_PREFIX_RE = new RegExp(`^\\**[ \\t]*${LABEL}[ \\t]*\\**[ \\t]*[:：][ \\t]*`);
const SECTION_HEADING_RE = new RegExp(
  `^[\\t ]*(?:#{1,6}[ \\t]*)?\\**[ \\t]*${LABEL}[ \\t]*\\**[ \\t]*[:：]?[ \\t]*$`
);
const PATH_AT = /`?([A-Za-z0-9_./-]+\.[A-Za-z0-9]{1,6})`?/y;
const RANGE_AT = /L?(\d+)(?:[ \t]*[-–~][ \t]*L?(\d+))?/y;
const SEP_AT = /[\s,/·():]+/y;

type ParsedRefLine = { sources: SourceItem[]; hasRange: boolean };

/** 줄이 참조만으로 이뤄져 있으면 소스를 돌려주고, 설명 문장이 섞여 있으면 null. */
const parseRefOnly = (text: string): ParsedRefLine | null => {
  const sources: SourceItem[] = [];
  let current: string | null = null;
  let hasRange = false;
  let i = 0;
  const at = (re: RegExp): RegExpExecArray | null => {
    re.lastIndex = i;
    const m = re.exec(text);
    if (m) i = re.lastIndex;
    return m;
  };
  while (i < text.length) {
    if (at(SEP_AT)) continue;
    const path = at(PATH_AT);
    if (path) {
      current = path[1];
      sources.push({ filePath: current, startLine: null, endLine: null, snippet: '' });
      continue;
    }
    const range = current ? at(RANGE_AT) : null;
    if (!range) return null;
    const start = Number(range[1]);
    const end = range[2] ? Number(range[2]) : start;
    hasRange = true;
    const last = sources[sources.length - 1];
    if (last.filePath === current && last.startLine === null) {
      last.startLine = start;
      last.endLine = end;
    } else {
      sources.push({ filePath: current as string, startLine: start, endLine: end, snippet: '' });
    }
  }
  return sources.length > 0 ? { sources, hasRange } : null;
};

/** bullet·라벨을 떼고 참조 전용이면 파싱. 섹션 안이 아니면 범위나 라벨이 있어야 참조로 본다(파일 이름만 적힌 목록 보호). */
const refLine = (line: string, inSection: boolean): SourceItem[] | null => {
  const isBullet = BULLET_RE.test(line);
  let body = line.replace(BULLET_RE, '').trim();
  // "(근거: x.ts:L1-29)" 처럼 줄 전체를 괄호로 감싼 경우
  const wrapped = body.match(/^\((.*)\)\.?$/);
  if (wrapped) body = wrapped[1].trim();
  const labeled = LABEL_PREFIX_RE.test(body);
  body = body.replace(LABEL_PREFIX_RE, '');
  if (!body || (!isBullet && !labeled)) return null;
  const parsed = parseRefOnly(body);
  if (!parsed) return null;
  if (!inSection && !labeled && !parsed.hasRange) return null;
  return parsed.sources;
};

export const extractReferenceLines = (
  content: string
): { content: string; sources: SourceItem[] } => {
  const lines = content.split('\n');
  const keep: string[] = [];
  const sources: SourceItem[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (SECTION_HEADING_RE.test(line)) {
      // 다음 빈 줄이 아닌 블록(연속 bullet)을 모아 전부 참조면 헤딩째 제거
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j++;
      const block: SourceItem[] = [];
      let k = j;
      let ok = k < lines.length;
      while (k < lines.length && lines[k].trim() !== '' && !/^[\t ]*#/.test(lines[k])) {
        const refs = refLine(lines[k], true);
        if (!refs) {
          ok = false;
          break;
        }
        block.push(...refs);
        k++;
      }
      if (ok && block.length > 0) {
        sources.push(...block);
        i = k - 1;
        continue;
      }
      keep.push(line);
      continue;
    }
    const refs = refLine(line, false);
    if (refs) {
      sources.push(...refs);
      continue;
    }
    keep.push(line);
  }
  const cleaned = keep
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (sources.length > 0 && cleaned.length < 10) return { content: content.trim(), sources };
  return { content: cleaned, sources };
};

/**
 * AI 답변 원문용: 참조 전용 줄 + 문장 속 괄호 참조까지 걷어내고 소스로 옮긴다. (메인 채팅·원본 대화)
 * 요약처럼 다듬어진 문장에는 extractReferenceLines 만 쓴다 — 문장 속 참조를 지우면 문장이 깨진다.
 */
export const cleanAnswerSources = (content: string): { content: string; sources: SourceItem[] } => {
  const lines = extractReferenceLines(content);
  const inline = extractInlineSources(lines.content);
  return { content: inline.content, sources: mergeSources(lines.sources, inline.sources) };
};
