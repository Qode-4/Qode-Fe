# Quire Foundations — 파운데이션 결정 기록

- 상태: **In sync** — Phase B 결정과 구현(`refactor/design-tokens`)이 이 문서와 일치한다. 토큰을 바꿀 때는 이 문서를 먼저 갱신하고 `yarn tokens:check`로 검증한다.
- 갱신일: 2026-09-25.
- 상위 문서: [`SYSTEM.md`](../SYSTEM.md). 실제 값의 기준은 구현 후 `src/renderer/src/assets/main.css`.
- 표기: 사용 횟수는 2026-09-25 기준 `src/renderer/src`(generated·stories 제외) grep 결과.

---

## 0. 결정 요약

| #    | 항목         | 결정                                                                            | 이유                                                                             |
| ---- | ------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| B1-1 | 토큰 계층    | raw → semantic 2층. component 층은 보류                                         | 처음부터 다 채우면 죽은 토큰이 생긴다. 반복 조합이 나타나면 그때 승격한다.       |
| B1-2 | Raw 규모     | 중간 스케일, 예측 가능한 번호 + 필요한 단계만                                   | 없는 shade도 이름을 예측할 수 있어야 확장이 자연스럽다.                          |
| B1-3 | 회색         | 현재 값 유지, `gray` 한 스케일로 이름만 붙임                                    | 화면 변화 없이 zinc/slate/임의 회색을 하나로 모은다.                             |
| B2   | 네이밍       | 전경 `fg-*`, 배경은 장소 이름, 선 `line-*`                                      | `text-text-base` 충돌 해소. 교체 범위 최소.                                      |
| B2   | 마이그레이션 | 한 번에 일괄 치환, alias 없음                                                   | 기계적 rename이다. 옛 이름이 남으면 어느 쪽이 맞는지 헷갈린다.                   |
| B3   | 오렌지 글자  | 글자용은 `fg-primary` = `#b54700`. `#ff6900`은 면·아이콘 전용                   | `#ff6900` 글자는 흰/크림 위 2.7~2.9:1로 AA 실패.                                 |
| B3   | 상태 색      | danger + success만                                                              | 실제 쓰는 두 가지. warning/info는 필요할 때 추가.                                |
| B3-1 | 대비 기준    | WCAG 2.1 AA만                                                                   | 표준 확정, 도구 많음. APCA는 확정 후 재검토.                                     |
| B3-2 | 검증         | `yarn tokens:check` 스크립트로 매트릭스 생성 + 의도한 조합이 기준 미달이면 실패 | 토큰이 바뀔 때마다 사람이 표를 갱신하면 어긋난다.                                |
| B4-1 | 타이포       | 두 스케일(`xs~5xl`, `ui-*`) + 임의 px → 역할 이름 7단계                         | 이름이 용도를 말해야 사람·AI가 고른다. `ui-16`=13px처럼 이름이 값을 속이지 않게. |
| B4-1 | 최소 크기    | 10px (base 13 기준)                                                             | 현재 8.1px 텍스트 24곳. 밀도는 높이되 읽을 수 있어야 한다(Density).              |
| B4-2 | 묶음         | 크기 + 줄간격. 굵기는 문서 규칙                                                 | 같은 크기에 다른 굵기가 필요한 경우(버튼 등)가 많다.                             |
| B5-1 | Spacing      | Tailwind 기본 4px 그리드 유지                                                   | 이미 관례로 잘 동작. spacing은 맥락 의존적이라 시맨틱화 이득이 적다.             |
| B5-2 | Radius       | 역할 이름 5단계, 값은 그대로                                                    | 이미 정착된 값에 이름만 붙인다.                                                  |
| B5-3 | Elevation    | `shadow-overlay` 하나만                                                         | 떠 있는 요소(메뉴·드롭다운) 4곳뿐. 그 외 그림자는 금지.                          |

---

## 1. 구조

```css
/* Tier 1 · Raw — 값. @theme 밖에 두어 유틸리티가 생성되지 않는다. */
:root {
  --palette-orange-500: #ff6900;
}

/* Tier 2 · Semantic — 역할. 컴포넌트는 이 층만 쓴다. */
@theme {
  --color-*: initial;
  --color-primary: var(--palette-orange-500);
}
```

- Raw는 `:root`의 `--palette-<hue>-<step>`, semantic은 `@theme`의 `--color-<역할>`. Tailwind v4는 `@theme`에 있는 semantic 이름으로만 유틸리티(`bg-primary`, `text-fg-default`)를 만든다. raw는 유틸리티가 없어 컴포넌트에서 쓸 수 없다.
- 아래 표의 `gray-50` 같은 raw 이름은 `--palette-gray-50`을 줄여 쓴 것이다.
- 컴포넌트 코드에 raw 이름(`text-orange-500`, `bg-gray-50`)이 보이면 규칙 위반이다.
- Tailwind 기본 팔레트·폰트 크기·radius·그림자는 `@theme`에서 `--color-*: initial` 등으로 지운다. `bg-zinc-800` 같은 직접 사용은 스타일이 아예 생성되지 않는다.
- 지워진 클래스는 에러 없이 조용히 무시되므로, `tokens:check`가 소스에서 raw 팔레트·기본 크기 클래스를 찾아 실패시킨다(§4).

---

## 2. Raw 팔레트

번호는 밝을수록 작다. 비어 있는 번호는 필요할 때 채운다.

### gray

| 토큰       | 값        | 흡수한 기존 값                                        |
| ---------- | --------- | ----------------------------------------------------- |
| `gray-0`   | `#ffffff` | surface                                               |
| `gray-25`  | `#fbfaf8` | sidebar                                               |
| `gray-50`  | `#faf6f1` | app-bg, surface-muted                                 |
| `gray-100` | `#efefef` | message, line-soft, zinc-100(`#f4f4f5`)               |
| `gray-150` | `#e4e4e7` | zinc-200, slate-200(`#e2e8f0`)                        |
| `gray-200` | `#dfddd8` | line                                                  |
| `gray-400` | `#9f9fa9` | zinc-400, zinc-500(`#71717b`)                         |
| `gray-600` | `#61646b` | text-soft, control-line                               |
| `gray-700` | `#52545a` | text-subtle, slate-600(`#45556c`)                     |
| `gray-850` | `#27272a` | zinc-800, zinc-700(`#3f3f47`)                         |
| `gray-900` | `#18181b` | zinc-900(Tailwind 기본)                               |
| `gray-950` | `#0e0e0f` | text-base, fill-icon(`#222222`), slate-900(`#0f172b`) |

괄호 안 값은 가장 가까운 단계로 흡수되며 미세하게 바뀐다(§8).

### orange / red / green

| 토큰         | 값        | 비고                            |
| ------------ | --------- | ------------------------------- |
| `orange-100` | `#fff0e5` | primary-soft                    |
| `orange-500` | `#ff6900` | 브랜드 시그니처                 |
| `orange-600` | `#e05e00` | primary-strong                  |
| `orange-700` | `#b54700` | accent-strong                   |
| `red-50`     | `#fff3f3` | danger-bg. Tailwind red-50 흡수 |
| `red-200`    | `#f1b5b5` | danger-line                     |
| `red-700`    | `#c62828` | danger. Tailwind red-600 흡수   |
| `green-50`   | `#ecfdf5` | 신규 (emerald-50)               |
| `green-200`  | `#a4f4cf` | 신규 (emerald-200·300)          |
| `green-700`  | `#007a55` | 신규 (emerald-600·700)          |

### 기타

| 토큰    | 값        | 비고              |
| ------- | --------- | ----------------- |
| `black` | `#000000` | 스크림 전용       |
| `white` | `#ffffff` | 어두운 면 위 글자 |

**삭제**: `slate-*`, `zinc-*`, `green-400`(사용 0), `message`(사용 0), `accent`(= primary 중복).

---

## 3. Semantic 색

### 배경 (장소 이름)

| 새 이름          | raw        | 기존 이름              | 사용 | 용도                                            |
| ---------------- | ---------- | ---------------------- | ---- | ----------------------------------------------- |
| `canvas`         | gray-50    | `app-bg`               | 3    | 앱 바탕                                         |
| `surface`        | gray-0     | `surface`              | 137  | 카드·패널·입력                                  |
| `surface-muted`  | gray-50    | `surface-muted`        | 58   | 표 헤더, 인라인 코드, 옅은 구획                 |
| `sidebar`        | gray-25    | `sidebar`              | 1    | 사이드바                                        |
| `primary`        | orange-500 | `primary`, `accent`    | —    | 주 액션 면                                      |
| `primary-strong` | orange-600 | `primary-strong`       | 3    | 주 액션 hover                                   |
| `primary-soft`   | orange-100 | `primary-soft`         | 21   | 선택·강조 면                                    |
| `danger`         | red-700    | `danger`               | 11   | 위험 액션 면, 강한 오류 경계                    |
| `danger-soft`    | red-50     | `danger-bg`, `red-50`  | 8+3  | 오류 면, 위험 메뉴 hover                        |
| `success-soft`   | green-50   | `emerald-50`           | 3    | 성공 면                                         |
| `code`           | gray-900   | `zinc-900`             | 2    | 코드 블록                                       |
| `code-raised`    | gray-850   | `zinc-800`             | 2    | 코드 블록 hover, 툴팁                           |
| `inverse`        | gray-850   | `zinc-800`(AppShell)   | 1    | 어두운 버튼                                     |
| `scrim`          | black      | `black/40`, `black/25` | 2    | 모달 뒤 덮개. `bg-scrim/40`처럼 불투명도로 조절 |

### 전경 `fg-*` (텍스트·아이콘)

| 새 이름         | raw        | 기존 이름                                 | 용도                          |
| --------------- | ---------- | ----------------------------------------- | ----------------------------- |
| `fg-default`    | gray-950   | `text-base`, `fill-icon`                  | 본문, 기본 아이콘             |
| `fg-subtle`     | gray-700   | `text-subtle`                             | 보조 본문                     |
| `fg-muted`      | gray-600   | `text-soft`, `zinc-500`(밝은 면)          | 메타·설명·플레이스홀더        |
| `fg-primary`    | orange-700 | `text-primary`, `accent`, `accent-strong` | 오렌지 글자·링크              |
| `fg-on-primary` | gray-950   | `primary-foreground`                      | 오렌지 면 위 글자             |
| `fg-danger`     | red-700    | `danger`, `red-600`                       | 오류 글자                     |
| `fg-success`    | green-700  | `emerald-600·700`                         | 성공 글자                     |
| `fg-code`       | gray-100   | `zinc-100`                                | 코드 블록 위 강조 글자        |
| `fg-code-muted` | gray-400   | `zinc-400·500`                            | 코드 블록 위 보조 글자·줄번호 |
| `fg-on-dark`    | white      | `white`                                   | 어두운 면 위 글자             |

**`#ff6900` 글자 금지**: `text-primary`(18곳)와 `text-accent`(6곳)는 모두 `text-fg-primary`(`#b54700`)로 바뀐다. `#ff6900`은 면·아이콘·포커스 링에만 쓴다.

### 선 `line-*`

| 새 이름        | raw        | 기존 이름                        | 용도                        |
| -------------- | ---------- | -------------------------------- | --------------------------- |
| `line`         | gray-200   | `line`                           | 기본 구분선·카드 경계(장식) |
| `line-soft`    | gray-100   | `line-soft`                      | 더 옅은 구분                |
| `line-strong`  | gray-600   | `control-line`                   | 입력·컨트롤 경계(3:1 필요)  |
| `line-primary` | orange-600 | `border-primary`, `ring-primary` | 선택 테두리·포커스 링       |
| `line-danger`  | red-200    | `danger-line`                    | 오류 경계                   |
| `line-success` | green-200  | `emerald-200·300`                | 성공 경계                   |
| `line-code`    | gray-850   | `zinc-800`                       | 코드 블록 경계              |

### 한 토큰이 여러 면에 쓰이던 경우

`danger`·`primary`는 면·글자·선에 두루 쓰였다. 유틸리티 접두어로 기계적으로 나눈다.

| 기존                             | 사용 | 새 이름                                    | 비고                                                 |
| -------------------------------- | ---- | ------------------------------------------ | ---------------------------------------------------- |
| `text-danger`                    | 33   | `text-fg-danger`                           |                                                      |
| `bg-danger`                      | 11   | `bg-danger`                                | 면용 `danger`(red-700) 유지. 위험 버튼 등            |
| `border-danger`, `ring-danger`   | 20   | `border-danger`                            | 강한 오류 경계는 `danger`, 옅은 경계는 `line-danger` |
| `text-primary`, `text-accent`    | 22   | `text-fg-primary`                          | 색이 진해짐                                          |
| `bg-primary`                     | 28   | `bg-primary`                               | 유지                                                 |
| `border-primary`, `ring-primary` | 25   | `border-line-primary`, `ring-line-primary` | `#ff6900`(2.89:1) → `#e05e00`(3.64:1)                |

---

## 4. 접근성

**기준**: WCAG 2.1 AA — 본문 4.5:1, 큰 텍스트(18.66px bold / 24px+)·비텍스트 UI 3:1.

### 의도한 조합 (tokens:check 허용 목록 초안)

| 전경                                | 배경                                      | 대비      | 기준 | 판정              |
| ----------------------------------- | ----------------------------------------- | --------- | ---- | ----------------- |
| fg-default                          | canvas / surface / sidebar / primary-soft | 17.3~19.3 | 4.5  | ✅                |
| fg-subtle                           | canvas / surface / primary-soft           | 6.8~7.6   | 4.5  | ✅                |
| fg-muted                            | canvas / surface / primary-soft           | 5.3~5.9   | 4.5  | ✅                |
| fg-primary                          | canvas / surface / primary-soft           | 4.9~5.4   | 4.5  | ✅                |
| fg-on-primary                       | primary                                   | 6.68      | 4.5  | ✅                |
| fg-danger                           | surface / danger-soft                     | 5.2~5.6   | 4.5  | ✅                |
| fg-success                          | surface / canvas / success-soft           | 5.0~5.4   | 4.5  | ✅                |
| fg-code                             | code-raised                               | 13.6      | 4.5  | ✅                |
| fg-code-muted                       | code / code-raised                        | 5.7~6.8   | 4.5  | ✅                |
| line-strong                         | surface                                   | 5.93      | 3    | ✅                |
| line-primary(선택 테두리·포커스 링) | surface / canvas                          | 3.38~3.64 | 3    | ✅                |
| line                                | surface                                   | 1.36      | —    | 장식용, 판정 제외 |

### tokens:check 동작

1. `main.css`의 `@theme`에서 semantic 색을 읽어 raw 참조를 값으로 풀어낸다.
2. 모든 `fg-*` × 배경 조합의 대비를 계산해 `docs/tokens/contrast-matrix.md`를 생성한다.
3. 위 허용 목록의 조합이 기준 미달이면 종료 코드 1로 실패한다.
4. 허용 목록에 없는 조합은 매트릭스에만 기록하고 실패시키지 않는다.
5. `src/renderer/src`에서 토큰이 아닌 클래스(`*-zinc-*`, `text-xs`, `rounded-md`, `text-[11px]` 등)를 찾으면 실패한다.

---

## 5. 타이포

### 스케일

작은 단계는 base에서 px을 빼고, 큰 단계는 base에 배율을 곱한다. "크게 보기"(base 15px)에서도 전 단계가 함께 커진다.

| 토큰           | 식          | 기본(13) | 크게(15) | 줄간격 | 용도                       |
| -------------- | ----------- | -------- | -------- | ------ | -------------------------- |
| `text-micro`   | base − 3px  | 10px     | 12px     | 1.4    | 배지·카운트·코드 블록 헤더 |
| `text-caption` | base − 2px  | 11px     | 13px     | 1.4    | 메타·타임스탬프·도움말     |
| `text-label`   | base − 1px  | 12px     | 14px     | 1.45   | 버튼·메뉴·탭·보조 텍스트   |
| `text-body`    | base        | 13px     | 15px     | 1.5    | 본문, 입력                 |
| `text-title`   | base × 1.25 | 16.25px  | 18.75px  | 1.4    | 모달·섹션 제목             |
| `text-heading` | base × 1.5  | 19.5px   | 22.5px   | 1.3    | 페이지 제목                |
| `text-display` | base × 2    | 26px     | 30px     | 1.2    | 인증·빈 화면 대형          |

`xs~5xl`, `ui-*`는 삭제한다.

### 기존 → 새 이름

| 기존                                | 기존 크기(13 기준) | 사용   | 새 이름         | 변화                               |
| ----------------------------------- | ------------------ | ------ | --------------- | ---------------------------------- |
| `ui-10`, `[10px]`                   | 8.1px / 10px       | 24 + 1 | micro           | 8.1 → 10 ▲                         |
| `ui-11`, `[11px]`                   | 8.9px / 11px       | 7 + 5  | micro / caption | 8.9 → 10 ▲, 11 유지                |
| `xs`, `ui-12`                       | 9.75px             | 99     | caption         | 9.75 → 11 ▲                        |
| `ui-13`                             | 10.6px             | 1      | caption         | ▲                                  |
| `sm`, `ui-14`                       | 11.4px             | 60     | label           | 11.4 → 12 ▲                        |
| `ui-15`                             | 12.2px             | 1      | label           | ≈                                  |
| `base`, `ui-16`, `[13px]`, `[14px]` | 13px / 14px        | 약 20  | body            | 없음 / 14 → 13 ▼ (드로어 제목 1곳) |
| `lg`, `[16px]`                      | 14.6px / 16px      | 1 + 3  | title           | ▲ 소폭                             |
| `xl`, `ui-20`, `[18px]`             | 16.25px / 18px     | 5 + 3  | title           | 없음 / ▼ 소폭                      |
| `2xl`, `ui-22`, `ui-24`\*           | 19.5px             | 3      | heading         | 없음                               |
| `ui-32`, `3xl`                      | 26px               | 2      | display         | 없음                               |
| `ui-44`, `5xl`                      | 35.75px / 39px     | 2      | display         | ▼ 26px                             |

\* `text-ui-24`(AuthFrame.tsx:74)는 테마에 정의되지 않아 지금 스타일이 적용되지 않는 상태다. 이번에 heading으로 바로잡는다.

`[16px]`·`[18px]` 일부는 아이콘 크기 조절용일 수 있다. 구현 시 한 곳씩 확인한다.

### 굵기 규칙

| 굵기                | 용도                                     |
| ------------------- | ---------------------------------------- |
| 400 `font-normal`   | 본문, 설명                               |
| 500 `font-medium`   | 버튼·라벨·선택 상태·답변 첫 문단         |
| 600 `font-semibold` | 제목(title 이상), 표 헤더, 마크다운 강조 |
| 700 `font-bold`     | 쓰지 않는다 (현재 3곳 → 600)             |

---

## 6. Radius

값은 그대로 두고 이름만 붙인다. 역할과 맞지 않는 사용처(예: 코드 블록이 6px)는 Phase C 컴포넌트 정비에서 재판정한다.

| 토큰              | 값   | 기존                                              | 사용 | 용도                                            |
| ----------------- | ---- | ------------------------------------------------- | ---- | ----------------------------------------------- |
| `rounded-inline`  | 4px  | `rounded`, `rounded-[4px]`                        | 15   | 인라인 코드·배지·메시지 액션                    |
| `rounded-control` | 6px  | `rounded-md`, `rounded-[6px]`                     | 65   | 버튼·입력·메뉴 아이템                           |
| `rounded-card`    | 8px  | `rounded-lg`, `rounded-[8px]`                     | 19   | 카드·팝오버                                     |
| `rounded-panel`   | 12px | `rounded-xl`, `rounded-[10px]`, `rounded-[12px]`  | 23   | 모달·말풍선·큰 컨테이너 (10px 흡수)             |
| `rounded-shell`   | 16px | `rounded-2xl`, `rounded-[16px]`, `rounded-[20px]` | 9    | 메인 채팅 카드·인증 폼·바텀시트 (20px 흡수)     |
| `rounded-full`    | —    | `rounded-full`                                    | 31   | 아바타·원형 인디케이터 (Tailwind 정적 유틸리티) |

방향 변형도 같이 바뀐다: `rounded-t` → `rounded-t-inline`, `rounded-t-2xl` → `rounded-t-shell`.

> 처음 집계(2026-09-25 초안)는 임의값 `rounded-[..]` 44곳을 놓쳤다. 구현 중 발견해 `shell`(16px)을 6번째 단계로 추가했다.

---

## 7. Spacing · Elevation

**Spacing** — Tailwind 기본 4px 그리드 유지. 권장값: 4 · 8 · 12 · 16 · 24 (`1 · 2 · 3 · 4 · 6`). 그 외 값은 이유가 있을 때만.

**Elevation** — 토큰 하나.

```css
--shadow-overlay: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
```

- 쓰는 곳: 기판 위에 떠서 다른 콘텐츠를 가리는 요소(드롭다운·컨텍스트 메뉴·팝오버). 현재 `shadow-lg` 4곳(ChatItemMenu, AppShell ×3)을 교체한다.
- 그 외 그림자는 쓰지 않는다. 새 그림자가 필요하면 이 문서에 먼저 등록한다.

---

## 8. 화면이 바뀌는 곳

일괄 치환은 대부분 이름만 바뀌지만, 아래는 실제로 보이는 모습이 달라진다.

| 변화                                                                         | 범위         | 원인                             |
| ---------------------------------------------------------------------------- | ------------ | -------------------------------- |
| 오렌지 글자가 진해짐 (`#ff6900` → `#b54700`)                                 | 약 24곳      | B3 오렌지 글자 규칙              |
| 작은 글자가 커짐 (8.1→10, 9.75→11, 11.4→12px)                                | 약 190곳     | B4 최소 10px                     |
| 위험 메뉴 빨강이 살짝 어두워짐 (Tailwind red-600 → `#c62828`)                | 3곳          | danger 통합                      |
| 성공 표시 초록 미세 변화 (emerald → green 토큰)                              | 5곳          | success 신설                     |
| 코드 블록 줄번호가 밝아짐 (zinc-500 → gray-400)                              | 1곳          | 3.67:1 → 6.75:1                  |
| 아이콘 색 `#222222` → `#0e0e0f`                                              | 3곳          | fill-icon 흡수                   |
| 인증 화면 부제 크기 적용됨                                                   | 1곳          | `ui-24` 미정의 버그 수정         |
| 대형 제목(`ui-44`, `5xl`) 26px로 축소                                        | 2곳          | display 단계 통합                |
| 오렌지 테두리·포커스 링이 살짝 진해짐 (`#ff6900` → `#e05e00`)                | 25곳         | 비텍스트 3:1                     |
| 입력창 focus 테두리가 살짝 진해짐 (`#ff6900` → `#e05e00`)                    | TextField 등 | 비텍스트 3:1                     |
| 링크 hover 색 변화 없어짐 (`#e05e00` hover → `fg-primary` 유지, 밑줄은 상시) | Link 1곳     | hover 색 3.64:1로 글자 기준 미달 |
| 10px radius 3곳 → 12px, 20px 1곳 → 16px                                      | 4곳          | radius 역할 흡수                 |
| 드로어 제목 14px → 13px                                                      | 1곳          | `[14px]` → body                  |
| 토큰 줄간격이 명시됨 (`leading-*` 없는 곳)                                   | 다수         | 크기+줄간격 묶음                 |

---

## 9. 구현 기록

브랜치 `refactor/design-tokens`(develop 기준), 성격별 커밋.

1. 색 — raw/semantic 재편, 색 유틸리티 407곳 치환.
2. 타이포 — 역할 스케일 도입, 244곳 치환. `max-sm:text-[16px]`(ChatComposer, iOS 자동확대 방지)은 예외로 유지.
3. Radius·그림자 — 135곳 치환.
4. `yarn tokens:check` — `scripts/tokens-check.ts`, 매트릭스 `docs/tokens/contrast-matrix.md` 생성. 의도한 조합은 스크립트의 `REQUIRED`, 의도적 예외는 `ALLOW`에 이유와 함께 둔다.
5. 문서 — `DESIGN.md` 토큰 표기 갱신, 이 문서 In sync.

### 확정된 추가 결정 (2026-09-25)

- 오렌지 테두리·포커스 링은 `line-primary`(`#e05e00`)로 분리한다. 면은 `#ff6900` 유지.
- Tailwind 기본값을 차단하고 tokens:check에 raw 클래스 검사를 넣는다.
- 대형 제목 2곳은 display(26px)로 통합한다. 7단계 유지.
- Radius에 `shell`(16px)을 추가한다. 10px → panel, 20px → shell로 흡수.
- raw 팔레트는 `--palette-*`로 `@theme` 밖에 둔다.

### 남은 일

- [ ] Storybook·실제 화면에서 §8 변화 육안 확인.
- [ ] `tokens:check`를 pre-commit 또는 CI에 넣을지 결정 (Phase G).
