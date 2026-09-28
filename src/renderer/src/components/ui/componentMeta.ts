/**
 * Quire 컴포넌트 registry 스키마 (docs/registry.md 로 합쳐진다 — yarn tokens:check)
 *
 * 컴포넌트마다 옆에 `Name.meta.ts` 를 두고 `satisfies ComponentMeta` 로 적는다.
 * props 는 적지 않는다(TS 타입이 원본). 쓰는 토큰은 스크립트가 className 에서 뽑는다.
 */
export type ComponentName =
  | 'Avatar'
  | 'Button'
  | 'ChatComposer'
  | 'ChatItemMenu'
  | 'CodeBlock'
  | 'ConfirmDialog'
  | 'DrawerHeader'
  | 'Icon'
  | 'IconButton'
  | 'InlineAlert'
  | 'Link'
  | 'Logo'
  | 'MarkdownAnswer'
  | 'OverlayModal'
  | 'ProjectSwitcher'
  | 'SourceList'
  | 'Spinner'
  | 'StateMessage'
  | 'SuggestionCard'
  | 'TextField'
  | 'Toast'
  | 'ToastProvider';

/** docs/patterns/<slug>.md */
export type PatternSlug = 'confirm' | 'error' | 'feedback' | 'empty-loading';

export type ComponentMeta = {
  name: ComponentName;
  category: 'action' | 'input' | 'overlay' | 'feedback' | 'display' | 'navigation';
  /** 한 줄 요약 — 무엇을 하는 컴포넌트인가 */
  summary: string;
  whenToUse: string[];
  /** 피할 상황. 대신 쓸 것이 있으면 "→ 컴포넌트" 로 끝낸다 */
  whenNotToUse: string[];
  related: ComponentName[];
  patterns: PatternSlug[];
  status: 'stable' | 'experimental' | 'deprecated';
};
