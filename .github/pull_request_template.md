## 요약

<!-- 무엇을 왜 바꿨는지 -->

## 화면이 바뀌는 곳

<!-- 없으면 "없음". 있으면 전/후 스크린샷 -->

## UI 를 바꿨다면 (`docs/ai-review-checklist.md`)

- [ ] `docs/registry.md` 의 기존 컴포넌트를 썼다 (새로 만들었다면 JSDoc + `*.meta.ts` + 스토리)
- [ ] 상황이 패턴에 해당하면 `docs/patterns/README.md` 의 결정 트리를 따랐다
- [ ] 문구는 `docs/copy.md` — 해요체, `…`, 용어집
- [ ] 로딩·오류·빈 상태·성공을 확인했다
- [ ] 스토리가 있다면 Storybook Accessibility 패널 위반 0
- [ ] 새 토큰·컴포넌트·패턴이면 문서를 먼저 고쳤다 (change-flow(`docs/process/change-flow.md`))

## 검증

- [ ] CI 통과 (lint · typecheck · test · tokens:check · build)
