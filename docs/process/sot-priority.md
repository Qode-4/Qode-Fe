# 문서 우선순위 (Source of Truth)

- 상태: **In sync** (2026-09-26)
- 상위: [`SYSTEM.md`](../../SYSTEM.md) · 변경 흐름: [`change-flow.md`](./change-flow.md)

## 누가 무엇의 기준인가

| 기준                                                                | 담당                                       |
| ------------------------------------------------------------------- | ------------------------------------------ |
| [`SYSTEM.md`](../../SYSTEM.md)                                      | 정체성·원칙·로드맵. 가장 위                |
| `src/renderer/src/assets/main.css`                                  | 토큰 **값**                                |
| [`docs/foundations.md`](../foundations.md)                          | 토큰의 **의미**와 쓰임                     |
| 컴포넌트 코드                                                       | 컴포넌트가 실제로 하는 일                  |
| `ui/*.meta.ts` + JSDoc → [`docs/registry.md`](../registry.md)(생성) | 컴포넌트를 언제 쓰고 피하나                |
| [`docs/patterns/`](../patterns/README.md)                           | 상황별 결정(확인·에러·피드백·빈 상태·로딩) |
| [`docs/copy.md`](../copy.md)                                        | 화면 문구                                  |
| [`DESIGN.md`](../../DESIGN.md)                                      | 브랜드·시각 언어·화면 구성                 |

## 어긋나면 누가 이기나

| 상황                          | 이기는 쪽 | 할 일                                                   |
| ----------------------------- | --------- | ------------------------------------------------------- |
| 토큰 값 vs 하드코딩           | 토큰      | 하드코딩 제거 (🤖 tokens:check)                         |
| meta·JSDoc vs 컴포넌트 코드   | 코드      | 의도된 변경이면 meta·JSDoc 갱신, 아니면 코드 수정       |
| DESIGN.md·foundations vs 구현 | 구현      | 의도된 변경이면 문서 갱신 + 결정 기록, 아니면 코드 수정 |
| 패턴·문구 문서 vs 새 화면     | 문서      | 화면을 맞춘다. 예외가 맞다면 문서 결정 기록에 추가      |
| 하위 문서 vs SYSTEM.md 원칙   | SYSTEM.md | SYSTEM.md 를 먼저 검토하고 하위 문서를 정렬             |

"구현이 이긴다"는 **지금 코드가 사실**이라는 뜻이지, 문서를 무시해도 된다는 뜻이 아니다 — 발견한 사람이 같은 PR 에서 문서를 맞춘다.

## 문서 상태 헤더

사람이 쓰는 기준 문서는 맨 위에 상태를 적는다.

```
- 상태: **In sync** (YYYY-MM-DD)   — 코드와 맞음. 날짜는 마지막으로 맞춘 날
- 상태: **Draft** (YYYY-MM-DD)     — 결정 중, 코드와 다를 수 있음
- 상태: **Out of sync** (YYYY-MM-DD) — 어긋난 걸 알고 있음. 이유와 이슈 링크를 함께
```

- 문서를 고치는 PR 에서 날짜를 갱신한다.
- 생성 파일(`docs/registry.md`, `docs/tokens/contrast-matrix.md`)은 헤더 대신 "생성 파일" 안내를 둔다 — CI 가 동기화를 검사한다.
