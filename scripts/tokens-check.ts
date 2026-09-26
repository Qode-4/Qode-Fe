/**
 * Quire 토큰 검사 (docs/foundations.md §4)
 *
 * 1. main.css 의 semantic 색을 값으로 풀어 fg × bg 대비 매트릭스를 docs/tokens/contrast-matrix.md 로 생성한다.
 * 2. REQUIRED 에 적힌 의도한 조합이 WCAG AA 기준 미달이면 실패한다.
 * 3. 렌더러 소스에서 토큰이 아닌 클래스(raw 팔레트·기본 크기·기본 radius·임의값)를 찾으면 실패한다.
 * 3b. 패턴 규칙 위반(브라우저 confirm/alert, 손 스피너, 버튼 라벨 바꿔치기, 하드코딩 색)을 찾으면 실패한다.
 * 4. cn.ts 토큰 목록이 main.css 와 같은지 본다.
 * 5. 컴포넌트 registry(docs/registry.md)를 생성하고 meta 누락을 검사한다 (scripts/registry.ts).
 *
 * 실행: yarn tokens:check
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { buildRegistry } from './registry';

const ROOT = join(__dirname, '..');
const CSS_PATH = join(ROOT, 'src/renderer/src/assets/main.css');
const SRC_DIR = join(ROOT, 'src/renderer/src');
const CN_PATH = join(ROOT, 'src/renderer/src/lib/cn.ts');
const MATRIX_PATH = join(ROOT, 'docs/tokens/contrast-matrix.md');
const REGISTRY_PATH = join(ROOT, 'docs/registry.md');

const TEXT = 4.5;
const UI = 3;

/** 실제로 함께 쓰는 조합. 새 조합을 쓰기 시작하면 여기에 추가한다. */
const REQUIRED: Array<{ fg: string; bg: string[]; min: number }> = [
  {
    fg: 'fg-default',
    bg: [
      'canvas',
      'surface',
      'surface-muted',
      'sidebar',
      'primary-soft',
      'danger-soft',
      'success-soft'
    ],
    min: TEXT
  },
  {
    fg: 'fg-subtle',
    bg: ['canvas', 'surface', 'surface-muted', 'sidebar', 'primary-soft'],
    min: TEXT
  },
  {
    fg: 'fg-muted',
    bg: ['canvas', 'surface', 'surface-muted', 'sidebar', 'primary-soft'],
    min: TEXT
  },
  { fg: 'fg-primary', bg: ['canvas', 'surface', 'surface-muted', 'primary-soft'], min: TEXT },
  { fg: 'fg-on-primary', bg: ['primary'], min: TEXT },
  { fg: 'fg-danger', bg: ['canvas', 'surface', 'danger-soft'], min: TEXT },
  { fg: 'fg-success', bg: ['canvas', 'surface', 'success-soft'], min: TEXT },
  { fg: 'fg-code', bg: ['code', 'code-raised'], min: TEXT },
  { fg: 'fg-code-muted', bg: ['code', 'code-raised'], min: TEXT },
  { fg: 'fg-on-dark', bg: ['danger', 'inverse'], min: TEXT },
  // 비텍스트 UI: 입력 경계, 선택 테두리·포커스 링, 오류 경계
  { fg: 'line-strong', bg: ['canvas', 'surface'], min: UI },
  { fg: 'line-primary', bg: ['canvas', 'surface'], min: UI },
  { fg: 'danger', bg: ['canvas', 'surface', 'danger-soft'], min: UI }
];

/** 매트릭스의 배경 열. scrim·scrollbar 는 글자가 올라가지 않아 제외한다. */
const BACKGROUNDS = [
  'canvas',
  'surface',
  'surface-muted',
  'sidebar',
  'primary',
  'primary-strong',
  'primary-soft',
  'danger',
  'danger-soft',
  'success-soft',
  'code',
  'code-raised',
  'inverse'
];

/** 소스에서 금지하는 클래스. 선행 경계는 공백·따옴표·변형 콜론 등. */
const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const COLOR_UTIL =
  'bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|outline|divide|fill|stroke|from|via|to|decoration|caret|accent|shadow|placeholder';
const FORBIDDEN: Array<{ re: RegExp; why: string }> = [
  {
    re: new RegExp(`(?:${COLOR_UTIL})-(?:${PALETTE})-\\d+`),
    why: 'Tailwind 기본 팔레트 — semantic 토큰을 쓴다'
  },
  {
    re: new RegExp(`(?:${COLOR_UTIL})-(?:white|black)(?![-\\w])`),
    why: 'white/black — fg-on-dark, scrim 등 semantic 토큰을 쓴다'
  },
  {
    re: new RegExp(`(?:${COLOR_UTIL})-\\[(?:#|rgb|hsl|oklch|var)`),
    why: '임의 색 값 — 토큰을 추가한다'
  },
  {
    re: /text-(?:xs|sm|base|lg|[2-9]?xl|ui-\d+)(?![-\w])/,
    why: '폐기된 폰트 크기 — text-micro~display 를 쓴다'
  },
  { re: /text-\[\d+(?:\.\d+)?(?:px|rem|em)\]/, why: '임의 폰트 크기 — 역할 스케일을 쓴다' },
  {
    re: /rounded(?:-(?:[trblse]|tl|tr|bl|br|ss|se|es|ee))?(?:-(?:xs|sm|md|lg|[2-4]?xl))?(?![-\w[])/,
    why: '기본 radius — rounded-inline/control/card/panel/shell 을 쓴다'
  },
  { re: /rounded(?:-[a-z]+)?-\[/, why: '임의 radius — 역할 토큰을 쓴다' },
  {
    re: /shadow(?:-(?:2xs|xs|sm|md|lg|xl|2xl))?(?![-\w[])|shadow-\[/,
    why: '그림자는 shadow-overlay 하나만'
  },
  { re: /font-bold(?![-\w])/, why: '굵기 규칙 — 제목도 semibold(600)까지' },
  {
    re: /(?:text-text-(?:base|subtle|soft)|app-bg|control-line|danger-bg|danger-line|primary-foreground|accent-strong|fill-icon)(?![-\w])/,
    why: '폐기된 토큰 이름'
  }
];
const BOUNDARY = /(?:^|[\s"'`:!([{,])-?$/;

/** 의도적 예외. 파일(렌더러 src 기준 상대경로) + 클래스 + 이유. */
const ALLOW: Array<{ file: string; token: string; why: string }> = [
  {
    file: 'components/ui/ChatComposer.tsx',
    token: 'text-[16px]',
    why: 'iOS Safari 입력 자동확대 방지(16px 고정)'
  }
];

// ── CSS 파싱 ────────────────────────────────────────────────────────────
const css = readFileSync(CSS_PATH, 'utf8');
const vars = new Map<string, string>();
for (const m of css.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars.set(m[1], m[2].trim());

const resolve = (name: string, depth = 0): string => {
  const raw = vars.get(name);
  if (!raw || depth > 10) throw new Error(`토큰을 찾을 수 없음: --${name}`);
  const ref = raw.match(/^var\(--([\w-]+)\)$/);
  return ref ? resolve(ref[1], depth + 1) : raw;
};
const color = (token: string): string => {
  const v = resolve(`color-${token}`);
  if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`hex 가 아닌 색: ${token} = ${v}`);
  return v;
};

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// ── 1·2. 대비 ───────────────────────────────────────────────────────────
const failures: string[] = [];
const required = new Map<string, number>();
for (const { fg, bg, min } of REQUIRED) {
  for (const b of bg) {
    required.set(`${fg}|${b}`, min);
    const ratio = contrast(color(fg), color(b));
    if (ratio < min) failures.push(`대비 미달: ${fg} on ${b} = ${ratio.toFixed(2)} (기준 ${min})`);
  }
}

const fgTokens = [...vars.keys()]
  .filter((k) => /^color-fg-/.test(k))
  .map((k) => k.replace(/^color-/, ''))
  .concat(['line-strong', 'line-primary', 'danger']);
const header = `| 전경 \\ 배경 | ${BACKGROUNDS.map((b) => `\`${b}\``).join(' | ')} |`;
const rows = fgTokens.map((fg) => {
  const cells = BACKGROUNDS.map((b) => {
    const ratio = contrast(color(fg), color(b));
    const min = required.get(`${fg}|${b}`);
    const text = ratio.toFixed(2);
    if (min === undefined) return ratio >= TEXT ? text : `<sub>${text}</sub>`;
    return ratio >= min ? `**${text}** ✅` : `**${text}** ❌`;
  });
  return `| \`${fg}\` \`${color(fg)}\` | ${cells.join(' | ')} |`;
});
const matrix = [
  '# Contrast matrix',
  '',
  '> `yarn tokens:check` 가 생성한다. 직접 수정하지 않는다.',
  '',
  '- 굵게 = 의도한 조합(`scripts/tokens-check.ts` 의 REQUIRED). ✅ 기준 충족 / ❌ 미달.',
  `- 기준: 텍스트 ${TEXT}:1, 비텍스트 UI(\`line-*\`, \`danger\` 경계) ${UI}:1 (WCAG 2.1 AA).`,
  `- 작은 숫자 = 의도하지 않은 조합 중 ${TEXT}:1 미만. 이 조합을 쓰려면 먼저 REQUIRED 에 추가해 검증한다.`,
  '',
  header,
  `|---|${BACKGROUNDS.map(() => '---').join('|')}|`,
  ...rows,
  ''
].join('\n');
mkdirSync(dirname(MATRIX_PATH), { recursive: true });
writeFileSync(MATRIX_PATH, matrix);

// ── 3. 소스 검사 ────────────────────────────────────────────────────────
const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === 'generated' || name === 'node_modules') continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|mdx)$/.test(name)) out.push(p);
  }
  return out;
};

for (const file of walk(SRC_DIR)) {
  const rel = relative(SRC_DIR, file);
  // cn.ts 는 토큰 이름 목록(설정)이지 className 이 아니다 — §4 동기화 검사가 따로 본다
  if (rel === 'lib/cn.ts') continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const { re, why } of FORBIDDEN) {
        const global = new RegExp(re.source, 'g');
        for (const m of line.matchAll(global)) {
          if (!BOUNDARY.test(line.slice(0, m.index))) continue;
          if (ALLOW.some((a) => a.file === rel && a.token === m[0])) continue;
          failures.push(`${rel}:${i + 1}  ${m[0]}  — ${why}`);
        }
      }
    });
}

// ── 3b. 패턴 규칙 (docs/patterns · docs/ai-review-checklist.md) ──────────
// className 이 아니라 코드 모양을 본다. 대신 쓸 것을 메시지에 적는다.
const PATTERN_RULES: Array<{ re: RegExp; why: string; except?: string[] }> = [
  {
    re: /(?<![\w.])(?:window\.)?(?:confirm|alert|prompt)\(/,
    why: '브라우저 대화상자 — 확인은 ConfirmDialog, 알림은 Toast·InlineAlert (patterns/confirm.md)'
  },
  {
    re: /animate-spin/,
    why: '손으로 만든 스피너 — Spinner 를 쓴다 (patterns/empty-loading.md)',
    except: ['components/ui/Spinner.tsx']
  },
  {
    re: /\.isPending\s*\?\s*'[^']*중(?:\.\.\.|…)'/,
    why: '처리 중 라벨 바꿔치기 — Button isLoading (patterns/empty-loading.md)'
  },
  {
    re: /['"`]#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?['"`]|rgba?\(\s*\d/,
    why: '하드코딩 색 — main.css 토큰을 쓴다'
  }
];
for (const file of walk(SRC_DIR)) {
  const rel = relative(SRC_DIR, file);
  if (!rel.endsWith('.tsx') || /\.(test|stories)\.tsx$/.test(rel)) continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (/^\s*(\/\/|\*)/.test(line)) return; // 주석
      for (const { re, why, except } of PATTERN_RULES) {
        if (except?.includes(rel)) continue;
        const m = line.match(re);
        if (m) failures.push(`${rel}:${i + 1}  ${m[0]}  — ${why}`);
      }
    });
}

// ── 4. cn() 토큰 등록 동기화 ────────────────────────────────────────────
// tailwind-merge 는 모르는 크기·radius 토큰을 색으로 오인해 지운다. main.css 와 cn.ts 목록이 같아야 한다.
const cnSrc = readFileSync(CN_PATH, 'utf8');
const themeKeys = (prefix: string): string[] =>
  [...vars.keys()]
    .filter((k) => k.startsWith(`${prefix}-`) && !k.includes('--'))
    .map((k) => k.slice(prefix.length + 1));
for (const [cssPrefix, cnKey] of [
  ['text', 'text'],
  ['radius', 'radius'],
  ['shadow', 'shadow']
] as const) {
  const m = cnSrc.match(new RegExp(`${cnKey}: \\[([^\\]]*)\\]`));
  const registered = m ? [...m[1].matchAll(/'([\w-]+)'/g)].map((x) => x[1]) : [];
  const defined = themeKeys(cssPrefix);
  const missing = defined.filter((t) => !registered.includes(t));
  const stale = registered.filter((t) => !defined.includes(t));
  if (missing.length) failures.push(`cn.ts ${cnKey} 에 미등록 토큰: ${missing.join(', ')}`);
  if (stale.length) failures.push(`cn.ts ${cnKey} 에 없는 토큰: ${stale.join(', ')}`);
}

// ── 5. 컴포넌트 registry ─────────────────────────────────────────────────
const registry = buildRegistry(ROOT);
writeFileSync(REGISTRY_PATH, registry.markdown);
failures.push(...registry.failures);

// ── 결과 ───────────────────────────────────────────────────────────────
console.log(`contrast matrix → ${relative(ROOT, MATRIX_PATH)}`);
console.log(`registry → ${relative(ROOT, REGISTRY_PATH)}`);
if (failures.length) {
  console.error(`\n✖ tokens:check ${failures.length}건\n`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log('✔ tokens:check 통과');
