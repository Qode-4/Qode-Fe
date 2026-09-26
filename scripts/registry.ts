/**
 * Quire 컴포넌트 registry 생성 (docs/components.md · Phase E)
 *
 * components/ui/*.meta.ts + 컴포넌트 JSDoc 의 옵션 줄 + className 에서 뽑은 토큰을
 * docs/registry.md 한 파일로 합친다. AI·사람이 "무엇을 쓸까"를 한 곳에서 찾게 하는 것이 목적.
 *
 * 검사: ui 컴포넌트마다 meta 가 있는지, 이름이 파일과 같은지, JSDoc ✅/❌ 가 있는지, 패턴 문서가 있는지.
 * tokens-check.ts 가 불러서 실행한다.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ComponentMeta } from '../src/renderer/src/components/ui/componentMeta';

const CATEGORY_ORDER: Array<[ComponentMeta['category'], string]> = [
  ['action', '액션'],
  ['input', '입력'],
  ['overlay', '오버레이'],
  ['feedback', '상태 알림'],
  ['display', '표시'],
  ['navigation', '내비게이션']
];

// JSDoc 에서 옵션 설명으로 옮길 줄 — "size: …", "variant: …" 와 그 이어지는 줄
const OPTION_LINE = /^\s*\*\s+([A-Za-z가-힣]+):\s+(.+)$/;
const CONTINUATION = /^\s*\*\s{2,}(\S.*)$/;

const extractOptions = (src: string): string[] => {
  const doc = src.match(/\/\*\*[\s\S]*?✅[\s\S]*?\*\//)?.[0] ?? '';
  const out: string[] = [];
  let current: string | null = null;
  for (const line of doc.split('\n')) {
    const opt = line.match(OPTION_LINE);
    if (opt && !/^(Use|Don't)$/.test(opt[1])) {
      if (current) out.push(current);
      current = `\`${opt[1]}\` ${opt[2].trim()}`;
      continue;
    }
    const cont = line.match(CONTINUATION);
    if (current && cont && !/^[✅❌]/.test(cont[1])) {
      current += ` ${cont[1].trim()}`;
      continue;
    }
    if (current) out.push(current);
    current = null;
  }
  if (current) out.push(current);
  return out;
};

const extractTokens = (
  src: string,
  vars: Set<string>
): { color: string[]; text: string[]; radius: string[]; shadow: string[] } => {
  const pick = (prefix: string): Set<string> =>
    new Set(
      [...vars].filter((v) => v.startsWith(`${prefix}-`)).map((v) => v.slice(prefix.length + 1))
    );
  const colors = pick('color');
  const sizes = pick('text');
  const radii = pick('radius');
  const shadows = pick('shadow');
  const found = {
    color: new Set<string>(),
    text: new Set<string>(),
    radius: new Set<string>(),
    shadow: new Set<string>()
  };
  const util =
    /(?<![\w-])(?:bg|text|border(?:-[trblxy])?|ring(?:-offset)?|outline|fill|stroke|divide|from|via|to|placeholder|decoration|caret)-([a-z][\w-]*?)(?:\/\d+)?(?![\w-])/g;
  for (const m of src.matchAll(util)) {
    if (colors.has(m[1])) found.color.add(m[1]);
    else if (m[0].startsWith('text-') && sizes.has(m[1])) found.text.add(m[1]);
  }
  for (const m of src.matchAll(/(?<![\w-])rounded(?:-[trblse]{1,2})?-([a-z]+)(?![\w-])/g))
    if (radii.has(m[1])) found.radius.add(m[1]);
  for (const m of src.matchAll(/(?<![\w-])shadow-([a-z]+)(?![\w-])/g))
    if (shadows.has(m[1])) found.shadow.add(m[1]);
  const sort = (s: Set<string>): string[] => [...s].sort();
  return {
    color: sort(found.color),
    text: sort(found.text),
    radius: sort(found.radius),
    shadow: sort(found.shadow)
  };
};

export const buildRegistry = (root: string): { markdown: string; failures: string[] } => {
  const uiDir = join(root, 'src/renderer/src/components/ui');
  const patternsDir = join(root, 'docs/patterns');
  const css = readFileSync(join(root, 'src/renderer/src/assets/main.css'), 'utf8');
  const vars = new Set([...css.matchAll(/--([\w-]+):/g)].map((m) => m[1]));
  const failures: string[] = [];

  // 컴포넌트 파일 = 대문자로 시작하는 .tsx (스토리·테스트 제외)
  const components = readdirSync(uiDir)
    .filter((f) => /^[A-Z]\w*\.tsx$/.test(f))
    .map((f) => f.replace(/\.tsx$/, ''));

  const entries: Array<{ meta: ComponentMeta; src: string }> = [];
  for (const name of components) {
    const src = readFileSync(join(uiDir, `${name}.tsx`), 'utf8');
    const metaPath = join(uiDir, `${name}.meta.ts`);
    if (!/\/\*\*[\s\S]*?✅[\s\S]*?❌[\s\S]*?\*\//.test(src))
      failures.push(`registry: ui/${name}.tsx 상단 JSDoc 에 ✅ Use / ❌ Don't 가 없음`);
    if (!existsSync(metaPath)) {
      failures.push(`registry: ui/${name}.meta.ts 가 없음 — componentMeta.ts 스키마로 추가한다`);
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const meta = require(metaPath).default as ComponentMeta;
    if (meta.name !== name) failures.push(`registry: ui/${name}.meta.ts 의 name 이 '${meta.name}'`);
    for (const p of meta.patterns)
      if (!existsSync(join(patternsDir, `${p}.md`)))
        failures.push(`registry: ${name} 의 패턴 문서 docs/patterns/${p}.md 가 없음`);
    entries.push({ meta, src });
  }
  for (const f of readdirSync(uiDir).filter((f) => f.endsWith('.meta.ts'))) {
    if (!components.includes(f.replace(/\.meta\.ts$/, '')))
      failures.push(`registry: ui/${f} 에 해당하는 컴포넌트가 없음`);
  }

  const byCategory = CATEGORY_ORDER.map(([key, label]) => ({
    label,
    items: entries
      .filter((e) => e.meta.category === key)
      .sort((a, b) => a.meta.name.localeCompare(b.meta.name))
  })).filter((c) => c.items.length);

  const patternLinks = (m: ComponentMeta): string =>
    m.patterns.map((p) => `[${p}](./patterns/${p}.md)`).join(' · ') || '—';

  const lines: string[] = [
    '# Quire Component Registry',
    '',
    '> `yarn tokens:check` 가 `components/ui/*.meta.ts`, 컴포넌트 JSDoc, className 에서 생성한다. 직접 수정하지 않는다.',
    '> 고칠 때는 해당 `*.meta.ts`(쓸 때·피할 때·관련·패턴) 나 컴포넌트 JSDoc(옵션)을 고치고 다시 생성한다.',
    '',
    'UI 를 만들거나 고칠 때: 아래 표에서 맞는 컴포넌트를 먼저 찾는다 → "피할 때"에 걸리면 → 로 안내된 컴포넌트를 쓴다 → 없으면 새로 만들기 전에 가장 가까운 것을 확장한다.',
    '상황별 결정(확인·에러·피드백·빈 상태·로딩)은 [`docs/patterns/`](./patterns/README.md), 토큰 의미는 [`docs/foundations.md`](./foundations.md).',
    '',
    '## 한눈에',
    '',
    '| 분류 | 컴포넌트 | 한 줄 | 패턴 |',
    '| --- | --- | --- | --- |'
  ];
  for (const c of byCategory)
    for (const { meta } of c.items)
      lines.push(
        `| ${c.label} | [${meta.name}](#${meta.name.toLowerCase()}) | ${meta.summary} | ${patternLinks(meta)} |`
      );

  for (const c of byCategory) {
    lines.push('', `## ${c.label}`);
    for (const { meta, src } of c.items) {
      const t = extractTokens(src, vars);
      const opts = extractOptions(src);
      lines.push(
        '',
        `### ${meta.name}`,
        '',
        `\`components/ui/${meta.name}.tsx\` · ${meta.status}`,
        '',
        meta.summary,
        '',
        '**쓸 때**',
        ...meta.whenToUse.map((x) => `- ${x}`),
        '',
        '**피할 때**',
        ...meta.whenNotToUse.map((x) => `- ${x}`)
      );
      if (opts.length) lines.push('', '**옵션**', ...opts.map((x) => `- ${x}`));
      const tokenParts = [
        t.color.length && `색 ${t.color.map((x) => `\`${x}\``).join(' ')}`,
        t.text.length && `글자 ${t.text.map((x) => `\`${x}\``).join(' ')}`,
        t.radius.length && `모서리 ${t.radius.map((x) => `\`${x}\``).join(' ')}`,
        t.shadow.length && `그림자 ${t.shadow.map((x) => `\`${x}\``).join(' ')}`
      ].filter(Boolean);
      lines.push(
        '',
        `**관련** ${meta.related.map((r) => `[${r}](#${r.toLowerCase()})`).join(' · ') || '—'} · **패턴** ${patternLinks(meta)}`
      );
      if (tokenParts.length) lines.push('', `**토큰** ${tokenParts.join(' · ')}`);
    }
  }
  lines.push('');
  return { markdown: lines.join('\n'), failures };
};
