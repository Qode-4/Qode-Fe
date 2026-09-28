import type { Meta, StoryObj } from '@storybook/react-vite';
import { MarkdownAnswer } from './MarkdownAnswer';
import { ToastProvider } from './ToastProvider';

/** AI 답변에 실제로 나오는 요소를 한 번에 — 첫 문단 강조, 목록, 인라인 코드, 코드 펜스, 표, 인용, 링크 */
const SAMPLE = `이 프로젝트의 유튜브 임베딩은 \`utils/youtube-pipeline.ts\` 에서 처리합니다.

## 흐름

1. URL 에서 영상 ID 를 뽑는다.
2. \`api/check-youtube.ts\` 로 임베딩 가능 여부를 확인한다.
3. 통과하면 창을 만든다.

\`\`\`ts
export const extractVideoId = (url: string): string | null => {
  const match = url.match(/(?:v=|youtu\\.be\\/)([\\w-]{11})/);
  return match?.[1] ?? null;
};
\`\`\`

| 단계 | 파일 |
|---|---|
| ID 추출 | youtube-pipeline.ts |
| 검증 | check-youtube.ts |

> 임베딩이 막힌 영상은 창을 만들지 않고 안내만 띄웁니다.

자세한 규칙은 [YouTube 문서](https://developers.google.com/youtube)를 참고하세요.`;

const meta = {
  title: 'Components/UI/MarkdownAnswer',
  component: MarkdownAnswer,
  tags: ['autodocs'],
  args: { content: SAMPLE },
  decorators: [
    (Story) => (
      <ToastProvider>
        <div className="w-[640px] rounded-panel bg-surface p-3">
          <Story />
        </div>
      </ToastProvider>
    )
  ]
} satisfies Meta<typeof MarkdownAnswer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
