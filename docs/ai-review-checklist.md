# AI 검수 체크리스트

- 상태: **In sync** (2026-09-26)

> UI 를 만들거나 고친 뒤, 사람이든 AI 든 머지 전에 이 순서로 확인한다.
> 🤖 = `yarn tokens:check` 가 자동으로 잡는 항목. 나머지는 눈으로 본다.

## 0. 시작 전에 읽었나

- [ ] [`docs/registry.md`](./registry.md) 에서 쓸 컴포넌트를 찾았다 — "피할 때"에 걸리면 → 로 안내된 것을 쓴다
- [ ] 상황이 패턴에 해당하면 [`docs/patterns/`](./patterns/README.md) 의 결정 트리를 따랐다
- [ ] 새 색·크기·모션이 필요하면 [`docs/foundations.md`](./foundations.md) 의 토큰부터 찾았다
- [ ] 문구는 [`docs/copy.md`](./copy.md) 의 톤·용어집을 따랐다

## 1. 토큰

- [ ] 🤖 Tailwind 기본 팔레트(`bg-blue-500`)·`white`/`black`·임의 색(`bg-[#..]`)이 없다
- [ ] 🤖 `'#ff6900'`·`rgb(...)` 같은 하드코딩 색이 없다
- [ ] 🤖 글자 크기는 `text-micro`~`text-display`, 모서리는 `rounded-inline/control/card/panel/shell`, 그림자는 `shadow-overlay` 만
- [ ] 글자색은 쓰임에 맞는 `fg-*` — 본문 `fg-default`, 보조 `fg-subtle`, 흐린 안내 `fg-muted`
- [ ] 새 fg × bg 조합이면 `scripts/tokens-check.ts` 의 REQUIRED 에 추가해 대비를 검증했다

## 2. 컴포넌트 재사용

- [ ] 같은 역할의 컴포넌트가 registry 에 있으면 그것을 썼다(버튼·입력·모달·아바타·아이콘 버튼을 손으로 만들지 않았다)
- [ ] 비슷하지만 조금 다르면 새로 만들기 전에 기존 것에 `variant`/`size`/`tone` 을 더하는 쪽을 검토했다
- [ ] 새 ui 컴포넌트를 만들었다면 JSDoc(✅/❌) + `*.meta.ts` + 스토리를 함께 추가했다 (🤖 meta·JSDoc 누락)

## 3. 상태 — 로딩 / 에러 / 빈 상태 / 성공

- [ ] 🤖 버튼 처리 중은 `Button isLoading` — 라벨을 "~ 중..." 으로 바꾸지 않는다
- [ ] 🤖 스피너는 `Spinner`/`StateMessage` 로만(손 `animate-spin` 금지)
- [ ] 영역 첫 로딩은 `StateMessage kind="loading"` — 무엇을 불러오는지 글자로
- [ ] 비어 있으면 `StateMessage kind="empty"` — 채울 수 있으면 다음 행동 한 줄 (그 자리에 컨트롤이 실제로 있을 때만)
- [ ] 실패는 시작한 자리에 — 모달은 모달 안 `InlineAlert`, 영역은 `InlineAlert` + 다시 시도, 제자리 동작만 토스트
- [ ] 성공은 화면에 보이면 조용히, 안 보이거나 보던 화면이 사라지면 토스트 "~했어요"

## 4. 확인

- [ ] 🤖 `window.confirm`·`alert`·`prompt` 가 없다
- [ ] 되돌릴 수 없는 동작만 `ConfirmDialog` 로 묻는다 — 제목은 질문형, 버튼은 결과 동사("삭제", "나가기"), "확인" 금지
- [ ] 모달 안에서는 모달을 겹치지 않고 그 줄 안에서 확인한다

## 5. 접근성

- [ ] 아이콘만 있는 버튼에 `aria-label` (IconButton 은 타입이 강제)
- [ ] 인터랙션 요소에 focus 표시가 보인다
- [ ] 입력에는 보이는 label — placeholder 로 대신하지 않는다
- [ ] 로딩·결과 안내는 `role="status"`, 오류만 `role="alert"`
- [ ] 키보드만으로 열고·이동하고·닫을 수 있다(메뉴·모달)
- [ ] 스토리가 있다면 Storybook **Accessibility** 패널 위반 0 (스크롤 영역은 `tabIndex={0}`, 잠긴 영역은 `inert`)

## 6. 레이아웃·밀도

- [ ] 작업 화면에 랜딩 페이지식 큰 여백·큰 제목을 쓰지 않았다
- [ ] 긴 한국어 제목·긴 파일 경로·좁은 폭(모바일)에서 깨지지 않는다 — 넘칠 곳에 `min-w-0`·`truncate`·`break-keep`
- [ ] 글자 확대(`data-font-size="large"`)에서도 겹치지 않는다

## 7. 안티패턴

- [ ] 알약형(`rounded-full`) 버튼·입력이 없다
- [ ] 장식용 그림자·그라디언트가 없다
- [ ] 미구현 기능을 동작하는 것처럼 보이게 하거나 가짜 수치를 넣지 않았다 — 서버가 없으면 `API_CAPABILITIES` 로 끄고 안내 문구
- [ ] 렌더러 코드가 Electron API(`window.electron`)에 의존하지 않는다(웹 배포가 깨진다)

## 8. 문구 — [`docs/copy.md`](./copy.md)

- [ ] 🤖 해요체 — `~습니다`·`~입니다` 없음(개발자용 `throw new Error` 제외)
- [ ] 🤖 말줄임표는 `…` 한 글자, 🤖 용어집(팀 채팅·저장소·방장 넘기기)
- [ ] 실패는 무엇을 못 했는지 + 다음 행동, 로딩은 "~를 불러오는 중…", 성공은 "~했어요"
- [ ] 버튼은 결과 동사, 같은 동작은 메뉴·모달 제목·버튼에서 같은 이름

## 9. 확인 방법

- [ ] `yarn lint` · `yarn typecheck` · `yarn test` · `yarn build` · `yarn tokens:check`
- [ ] 바뀐 화면을 실제로 열어 기본·hover/focus·로딩·오류·빈 상태를 봤다
