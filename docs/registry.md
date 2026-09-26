# Quire Component Registry

> `yarn tokens:check` 가 `components/ui/*.meta.ts`, 컴포넌트 JSDoc, className 에서 생성한다. 직접 수정하지 않는다.
> 고칠 때는 해당 `*.meta.ts`(쓸 때·피할 때·관련·패턴) 나 컴포넌트 JSDoc(옵션)을 고치고 다시 생성한다.

UI 를 만들거나 고칠 때: 아래 표에서 맞는 컴포넌트를 먼저 찾는다 → "피할 때"에 걸리면 → 로 안내된 컴포넌트를 쓴다 → 없으면 새로 만들기 전에 가장 가까운 것을 확장한다.
상황별 결정(확인·에러·피드백·빈 상태·로딩)은 [`docs/patterns/`](./patterns/README.md), 토큰 의미는 [`docs/foundations.md`](./foundations.md).

## 한눈에

| 분류 | 컴포넌트 | 한 줄 | 패턴 |
| --- | --- | --- | --- |
| 액션 | [Button](#button) | 제출·저장·실행·삭제처럼 결과가 있는 동작 | [confirm](./patterns/confirm.md) · [error](./patterns/error.md) · [empty-loading](./patterns/empty-loading.md) |
| 액션 | [IconButton](#iconbutton) | 글자 없이 아이콘만 있는 버튼 | — |
| 액션 | [Link](#link) | 앱 안 화면 이동(해시 라우터) | — |
| 입력 | [ChatComposer](#chatcomposer) | 채팅 메시지 입력과 전송 | — |
| 입력 | [TextField](#textfield) | 라벨·도움말·오류가 붙는 한 줄 입력 | [error](./patterns/error.md) |
| 오버레이 | [ChatItemMenu](#chatitemmenu) | ⋯ 버튼으로 여는 항목별 작업 메뉴 | [confirm](./patterns/confirm.md) |
| 오버레이 | [ConfirmDialog](#confirmdialog) | 되돌릴 수 없는 액션 직전의 확인 | [confirm](./patterns/confirm.md) · [error](./patterns/error.md) |
| 오버레이 | [OverlayModal](#overlaymodal) | 흐름을 멈추고 집중이 필요한 작업 | [confirm](./patterns/confirm.md) · [error](./patterns/error.md) · [feedback](./patterns/feedback.md) |
| 상태 알림 | [InlineAlert](#inlinealert) | 화면 안에 머무는 상태 안내 | [error](./patterns/error.md) · [feedback](./patterns/feedback.md) |
| 상태 알림 | [Spinner](#spinner) | 기다리는 중임을 알리는 원형 표시 | [empty-loading](./patterns/empty-loading.md) |
| 상태 알림 | [StateMessage](#statemessage) | 영역이 비었거나 불러오는 중일 때의 안내 | [empty-loading](./patterns/empty-loading.md) |
| 상태 알림 | [Toast](#toast) | 잠깐 떴다 사라지는 결과 알림(오른쪽 위) | [error](./patterns/error.md) · [feedback](./patterns/feedback.md) |
| 상태 알림 | [ToastProvider](#toastprovider) | 토스트 상태와 오른쪽 위 쌓기 영역 | [feedback](./patterns/feedback.md) |
| 표시 | [Avatar](#avatar) | 사람(사진·이니셜) 또는 Qode AI 를 나타내는 원 | — |
| 표시 | [CodeBlock](#codeblock) | 줄번호·복사 버튼이 있는 다크 코드 블록 | — |
| 표시 | [Icon](#icon) | 레지스트리에 등록된 SVG 아이콘 | — |
| 표시 | [Logo](#logo) | Qode 브랜드 표기(심볼·글자·조합) | — |
| 표시 | [MarkdownAnswer](#markdownanswer) | AI 답변·요약 마크다운 렌더 | — |
| 표시 | [SourceList](#sourcelist) | AI 답변이 참조한 코드 위치 목록(같은 파일은 한 줄) | — |
| 표시 | [SuggestionCard](#suggestioncard) | 빈 화면에서 물어볼 수 있는 질문 예시 | [empty-loading](./patterns/empty-loading.md) |
| 내비게이션 | [DrawerHeader](#drawerheader) | 사이드바 머리: 브랜드 + 프로젝트 선택 + 설정 | — |
| 내비게이션 | [ProjectSwitcher](#projectswitcher) | 현재 프로젝트 표시와 전환 | [error](./patterns/error.md) · [empty-loading](./patterns/empty-loading.md) |

## 액션

### Button

`components/ui/Button.tsx` · stable

제출·저장·실행·삭제처럼 결과가 있는 동작

**쓸 때**
- 폼 제출, 모달 주 액션 — 화면당 primary 하나
- 처리 중엔 isLoading(라벨은 그대로, 스피너만)
- 되돌릴 수 없는 삭제는 variant="danger"

**피할 때**
- 페이지 이동 → Link
- 아이콘만 → IconButton
- 처리 중 라벨을 "~ 중..." 으로 바꾸기 → isLoading

**옵션**
- `variant` primary 화면당 하나(주 액션) · secondary 보조·취소 · ghost 목록 안 가벼운 액션 · danger 되돌릴 수 없는 삭제
- `size` md 기본(폼·모달 하단) · sm 카드·알림 안 보조 버튼

**관련** [IconButton](#iconbutton) · [Link](#link) · [Spinner](#spinner) · **패턴** [confirm](./patterns/confirm.md) · [error](./patterns/error.md) · [empty-loading](./patterns/empty-loading.md)

**토큰** 색 `danger` `fg-default` `fg-on-dark` `fg-on-primary` `fg-subtle` `line` `line-primary` `primary` `surface` `surface-muted` · 글자 `caption` `label` · 모서리 `control`

### IconButton

`components/ui/IconButton.tsx` · stable

글자 없이 아이콘만 있는 버튼

**쓸 때**
- 설정·닫기·더보기처럼 아이콘만으로 뜻이 통하는 동작
- aria-label 필수(타입으로 강제)

**피할 때**
- 뜻이 모호함 → Button
- 페이지 이동

**옵션**
- `variant` ghost 기본(목록·카드 안) · outline 헤더처럼 단독으로 놓일 때
- `size` md 36px(아이콘 20) 기본 · sm 24px(아이콘 16) 목록 줄 안의 ⋯·+

**관련** [Button](#button) · [Icon](#icon) · [ChatItemMenu](#chatitemmenu) · **패턴** —

**토큰** 색 `fg-default` `line` `surface` `surface-muted` · 모서리 `control` `inline`

### Link

`components/ui/Link.tsx` · stable

앱 안 화면 이동(해시 라우터)

**쓸 때**
- 문장 안이나 폼 아래의 이동 링크

**피할 때**
- 실행·저장 같은 동작 → Button
- 외부 URL → <a target="_blank">
- 버튼처럼 꾸미기

**관련** [Button](#button) · **패턴** —

**토큰** 색 `fg-default` `fg-primary` · 글자 `label` · 모서리 `inline`

## 입력

### ChatComposer

`components/ui/ChatComposer.tsx` · stable

채팅 메시지 입력과 전송

**쓸 때**
- AI 채팅·팀 채팅 하단 입력
- 진행 상태는 status 로 입력창 위에
- 전송 불가 이유는 sendDisabledReason
- 전송 버튼은 입력창 옆(아래가 아님)

**피할 때**
- 폼 입력 → TextField
- placeholder 에 상태 넣기
- 테두리·outline 추가(focus 는 배경 전환으로만)

**관련** [TextField](#textfield) · [Spinner](#spinner) · **패턴** —

**토큰** 색 `fg-danger` `fg-default` `fg-muted` `fg-on-primary` `line` `line-soft` `primary` `primary-soft` `primary-strong` · 글자 `caption` `label` · 모서리 `control` `panel`

### TextField

`components/ui/TextField.tsx` · stable

라벨·도움말·오류가 붙는 한 줄 입력

**쓸 때**
- 폼 입력(이메일·비밀번호·이름)
- 오류는 error prop 으로 입력 바로 아래(원인 + 다음 행동)
- 인증 화면 size="md", 모달·설정 size="sm"

**피할 때**
- 여러 줄 → textarea
- 채팅 입력 → ChatComposer
- label 을 placeholder 로 대신하기

**옵션**
- `size` md 인증 화면(44px) · sm 모달·설정 안(40px)

**관련** [ChatComposer](#chatcomposer) · [InlineAlert](#inlinealert) · **패턴** [error](./patterns/error.md)

**토큰** 색 `danger` `danger-soft` `fg-danger` `fg-default` `fg-muted` `fg-subtle` `line-primary` `line-strong` `surface` `surface-muted` · 글자 `caption` `label` · 모서리 `card` `control`

## 오버레이

### ChatItemMenu

`components/ui/ChatItemMenu.tsx` · stable

⋯ 버튼으로 여는 항목별 작업 메뉴

**쓸 때**
- 목록 항목(채팅·카드) 하나에 딸린 작업 2~5개
- 위험 작업은 맨 아래, 비활성은 이유를 label 에

**피할 때**
- 화면 전체 작업 → 헤더의 Button
- 작업이 1개 → IconButton

**옵션**
- `triggerSize` sm 목록 줄 안(기본) · md 헤더

**관련** [IconButton](#iconbutton) · [ConfirmDialog](#confirmdialog) · **패턴** [confirm](./patterns/confirm.md)

**토큰** 색 `danger-soft` `fg-danger` `fg-default` `fg-muted` `line` `surface` `surface-muted` · 글자 `caption` `label` · 모서리 `card` `control` `shell` · 그림자 `overlay`

### ConfirmDialog

`components/ui/ConfirmDialog.tsx` · stable

되돌릴 수 없는 액션 직전의 확인

**쓸 때**
- 삭제·나가기·제거·소유권 이전 직전
- 나에게만 영향이면 기본, 다른 사람에게 영향·큰 손실이면 emphasis
- 실패하면 닫지 말고 error 로 모달 안에

**피할 때**
- window.confirm
- 되돌릴 수 있는 동작(이름 바꾸기 등)
- 버튼 라벨 "확인" — 결과 동사를 쓴다
- 모달 안에서 또 띄우기 → 그 줄 안에서 확인

**관련** [OverlayModal](#overlaymodal) · [Button](#button) · [InlineAlert](#inlinealert) · **패턴** [confirm](./patterns/confirm.md) · [error](./patterns/error.md)

**토큰** 색 `fg-default` · 글자 `label`

### OverlayModal

`components/ui/OverlayModal.tsx` · stable

흐름을 멈추고 집중이 필요한 작업

**쓸 때**
- 입력 몇 개로 끝나는 만들기·이름 바꾸기
- footer 오른쪽 끝 [취소 secondary][주 액션 primary]
- 폭은 size 로만(sm 440 · md 520 · lg 640 · xl 720)

**피할 때**
- 결과 알림 → Toast
- 화면 안 오류 → InlineAlert
- 모달 위에 모달
- 되돌릴 수 없는 확인 → ConfirmDialog

**옵션**
- `footer` 오른쪽 끝에 [취소 secondary] [주 액션 primary] 순서.
- `size` sm 440 확인·짧은 입력 · md 520 기본 폼 · lg 640 여러 단계 폼 · xl 720 긴 답변·코드 보기

**관련** [ConfirmDialog](#confirmdialog) · [InlineAlert](#inlinealert) · [Button](#button) · **패턴** [confirm](./patterns/confirm.md) · [error](./patterns/error.md) · [feedback](./patterns/feedback.md)

**토큰** 색 `fg-default` `fg-subtle` `line` `line-strong` `scrim` `surface` `surface-muted` · 글자 `caption` `label` `title` · 모서리 `control` `shell`

## 상태 알림

### InlineAlert

`components/ui/InlineAlert.tsx` · stable

화면 안에 머무는 상태 안내

**쓸 때**
- 모달·폼·영역 안 오류와 복구 방법(원인 + 다음 행동)
- 재시도는 안에 Button size="sm" variant="secondary"
- 모달이 열린 채 끝나는 성공은 tone="success"

**피할 때**
- 잠깐 알리고 사라져도 되는 결과 → Toast
- 로딩·빈 상태 → StateMessage
- 오렌지(primary)를 성공·실패 상태색으로 쓰기 — tone 을 쓴다

**옵션**
- `tone` danger 오류(원인+다음 행동) · info 안내 · success 오래 남겨야 할 완료

**관련** [Toast](#toast) · [StateMessage](#statemessage) · [Button](#button) · **패턴** [error](./patterns/error.md) · [feedback](./patterns/feedback.md)

**토큰** 색 `danger-soft` `fg-danger` `fg-default` `fg-success` `line-danger` `line-soft` `line-success` `success-soft` `surface-muted` · 글자 `label` · 모서리 `panel`

### Spinner

`components/ui/Spinner.tsx` · stable

기다리는 중임을 알리는 원형 표시

**쓸 때**
- Button isLoading·StateMessage 안에서(보통 직접 안 씀)
- 화면 전체 첫 로딩은 size="lg" tone="brand" + 글자

**피할 때**
- 혼자 두기 — 무엇을 기다리는지 글자와 함께
- animate-spin 으로 손수 만들기

**옵션**
- `size` sm 12 문장 안 · md 14 버튼 · lg 32 화면 로딩

**관련** [StateMessage](#statemessage) · [Button](#button) · **패턴** [empty-loading](./patterns/empty-loading.md)

**토큰** 색 `line` `line-primary`

### StateMessage

`components/ui/StateMessage.tsx` · stable

영역이 비었거나 불러오는 중일 때의 안내

**쓸 때**
- 목록·모달·패널 영역의 첫 로딩 — "~를 불러오는 중…"
- 빈 상태 — 무엇이 없는지, 채울 수 있으면 action 으로 다음 행동

**피할 때**
- 버튼 처리 중 → Button isLoading
- 실패 → InlineAlert
- AI 답변 대기 → LoadingDots

**관련** [Spinner](#spinner) · [InlineAlert](#inlinealert) · [SuggestionCard](#suggestioncard) · **패턴** [empty-loading](./patterns/empty-loading.md)

**토큰** 색 `fg-muted` `fg-subtle` · 글자 `caption`

### Toast

`components/ui/Toast.tsx` · stable

잠깐 떴다 사라지는 결과 알림(오른쪽 위)

**쓸 때**
- 결과가 화면에 안 보이는 성공(복사·공유) — "~했어요"
- 보던 화면이 사라진 이유(보던 채팅 삭제)
- 제자리·백그라운드 동작의 실패

**피할 때**
- 모달 안 오류 → InlineAlert
- 결과가 화면에 바로 보이는 성공 — 알리지 않는다
- 한 동작에 토스트 여러 개

**옵션**
- `tone` success 완료(3초) · info 안내(4초) · danger 실패(원인+다음 행동, 5초)

**관련** [InlineAlert](#inlinealert) · [ToastProvider](#toastprovider) · **패턴** [error](./patterns/error.md) · [feedback](./patterns/feedback.md)

**토큰** 색 `danger-soft` `fg-danger` `fg-default` `fg-muted` `fg-subtle` `fg-success` `line` `line-danger` `line-success` `success-soft` `surface` · 글자 `label` `title` · 모서리 `inline` `panel` · 그림자 `overlay`

### ToastProvider

`components/ui/ToastProvider.tsx` · stable

토스트 상태와 오른쪽 위 쌓기 영역

**쓸 때**
- 앱 루트에서 한 번만 감싼다. 띄우기는 useToast()

**피할 때**
- 화면·모달마다 다시 감싸기(스토리·테스트는 예외)

**관련** [Toast](#toast) · **패턴** [feedback](./patterns/feedback.md)

## 표시

### Avatar

`components/ui/Avatar.tsx` · stable

사람(사진·이니셜) 또는 Qode AI 를 나타내는 원

**쓸 때**
- 메시지·참여자·프로필 옆 — 이름이 옆에 글자로 있을 때
- 사진을 못 불러오면 이니셜로 자동 전환
- 겹쳐 쌓을 땐 ring, 남은 인원은 text="+N"

**피할 때**
- 원형 숫자·단계 표시
- 이름 없이 아바타만 단독으로

**옵션**
- `size` sm 24 메시지 · md 28 목록·헤더 · lg 32 참여자 목록 · xl 40 프로필 창
- `tone` brand 나·팀 강조 · neutral 기본

**관련** — · **패턴** —

**토큰** 색 `fg-muted` `fg-primary` `line` `line-primary` `primary-soft` `surface` `surface-muted` · 글자 `body` `caption`

### CodeBlock

`components/ui/CodeBlock.tsx` · stable

줄번호·복사 버튼이 있는 다크 코드 블록

**쓸 때**
- 여러 줄 코드 — 보통 MarkdownAnswer 가 코드 펜스를 바꿔 줌
- 긴 줄은 블록 안 가로 스크롤(부모에 min-w-0)
- 코드 글자는 text-label — 더 작게(text-caption) 하면 읽기 어렵다

**피할 때**
- 한 줄 안의 짧은 코드 → 인라인 <code>

**관련** [MarkdownAnswer](#markdownanswer) · [SourceList](#sourcelist) · **패턴** —

**토큰** 색 `code` `code-raised` `fg-code` `fg-code-muted` `line-code` `line-primary` · 글자 `label` `micro` · 모서리 `control` `inline`

### Icon

`components/ui/Icon.tsx` · stable

레지스트리에 등록된 SVG 아이콘

**쓸 때**
- 글자 옆 보조 아이콘(decorative 기본)
- 아이콘만으로 뜻을 전하면 decorative={false} + aria-label

**피할 때**
- 클릭 가능한 아이콘 → IconButton
- SVG 직접 import — icons/raw 에 넣고 iconRegistry 에 등록
- 숫자 크기

**옵션**
- `size` sm 16 글자 옆(가장 많이) · md 24 · lg 28 강조 · 숫자는 피한다

**관련** [IconButton](#iconbutton) · **패턴** —

**토큰** 색 `fg-default`

### Logo

`components/ui/Logo.tsx` · stable

Qode 브랜드 표기(심볼·글자·조합)

**쓸 때**
- 앱 헤더·인증 화면의 브랜드 자리

**피할 때**
- 심볼과 글자를 따로 <img> 로 조립
- 텍스트로 대신 쓰기

**옵션**
- `variant` lockup 기본 · mark 심볼만 · wordmark 글자만
- `size` sm 사이드바 · md 인증 화면

**관련** [Avatar](#avatar) · [DrawerHeader](#drawerheader) · **패턴** —

### MarkdownAnswer

`components/ui/MarkdownAnswer.tsx` · stable

AI 답변·요약 마크다운 렌더

**쓸 때**
- AI 가 만든 본문 — 코드 펜스는 CodeBlock, 링크는 새 탭

**피할 때**
- 사용자가 쓴 메시지·일반 UI 문구
- 본문에 참조 표기 남기기 → cleanAnswerSources 후 SourceList

**관련** [CodeBlock](#codeblock) · [SourceList](#sourcelist) · **패턴** —

**토큰** 색 `fg-default` · 글자 `body`

### SourceList

`components/ui/SourceList.tsx` · stable

AI 답변이 참조한 코드 위치 목록(같은 파일은 한 줄)

**쓸 때**
- 답변·요약 카드 아래 참조 소스 표기 — 참조 목록은 이것 하나만(메인 채팅·원본 대화·팀 공유 카드·공유 미리보기)
- 파일 순서는 서버가 준 관련도 순, 줄 범위는 오른쪽 끝에 오름차순
- 높이가 제한된 모달에서만 maxHeight

**피할 때**
- 코드 본문 미리보기 → CodeBlock
- 클릭 이동이 필요한 파일 탐색 목록
- 응답에 없는 소스·줄 번호 채워 넣기
- 겹치는 줄 범위를 임의로 합치기 — 완전히 같은 범위만 합친다
- 화면마다 참조 목록을 따로 만들기

**관련** [CodeBlock](#codeblock) · [MarkdownAnswer](#markdownanswer) · **패턴** —

**토큰** 색 `fg-default` `fg-muted` `fg-subtle` `line` `line-primary` `line-soft` `surface` `surface-muted` · 글자 `caption` · 모서리 `card`

### SuggestionCard

`components/ui/SuggestionCard.tsx` · stable

빈 화면에서 물어볼 수 있는 질문 예시

**쓸 때**
- 첫 방문·빈 채팅에서 무엇을 할 수 있는지 보여줄 때(<ul> 안)

**피할 때**
- 누를 수 있는 것처럼 꾸미기 — 실제 동작은 옆의 Button

**관련** [StateMessage](#statemessage) · [Button](#button) · **패턴** [empty-loading](./patterns/empty-loading.md)

**토큰** 색 `fg-subtle` `surface-muted` · 글자 `label` · 모서리 `panel`

## 내비게이션

### DrawerHeader

`components/ui/DrawerHeader.tsx` · stable

사이드바 머리: 브랜드 + 프로젝트 선택 + 설정

**쓸 때**
- AppShell 사이드바 맨 위 한 곳

**피할 때**
- 다른 화면의 헤더로 재사용

**관련** [ProjectSwitcher](#projectswitcher) · [Logo](#logo) · **패턴** —

### ProjectSwitcher

`components/ui/ProjectSwitcher.tsx` · stable

현재 프로젝트 표시와 전환

**쓸 때**
- 사이드바 상단 한 곳, 목록 맨 아래 "+ 새 프로젝트"

**피할 때**
- 프로젝트 선택 UI 새로 만들기 — 이것이나 목록 데이터를 재사용

**옵션**
- `키보드` Enter/Space/↓ 열기 · ↑↓ Home End 이동 · Enter 선택 · Esc 닫기

**관련** [DrawerHeader](#drawerheader) · **패턴** [error](./patterns/error.md) · [empty-loading](./patterns/empty-loading.md)

**토큰** 색 `fg-default` `fg-muted` `fg-subtle` `line` `surface` `surface-muted` · 글자 `body` `caption` `label` `title` · 모서리 `control` `panel`
