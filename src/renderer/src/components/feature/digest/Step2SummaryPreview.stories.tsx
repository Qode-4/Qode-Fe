import type { Meta, StoryObj } from '@storybook/react-vite';
import { Step2SummaryPreview } from './Step2SummaryPreview';
import { MAX_PREVIEW_RETRY } from '../../../api/contracts/digest';

const sampleContent = `## 결제 실패 처리 흐름 정리

- \`CheckoutErrorBoundary\` 에서 3DS/PG 오류 코드를 friendly 메시지로 변환한다.
- axios interceptor 는 5xx/네트워크 오류에 한해 지수 백오프로 최대 3회 재시도한다.
- 사용자는 결제 페이지 상단 배너로 안내를 본다.

## 확인이 필요한 부분

- [ ] 4xx 오류 중 재시도가 유효한 케이스가 있는지 검토
- [ ] 카드사 코드 → 문구 매핑 테이블 최신화 여부 확인`;

const sampleSources = [
  { filePath: 'src/renderer/src/pages/CheckoutPage.tsx', startLine: 88, endLine: 132, snippet: '' },
  { filePath: 'src/renderer/src/api/apiClient.ts', startLine: 34, endLine: 40, snippet: '' },
  { filePath: 'src/renderer/src/api/errorMap.ts', startLine: 1, endLine: 60, snippet: '' }
];

const meta = {
  title: 'Components/Feature/Digest/Step2SummaryPreview',
  component: Step2SummaryPreview,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    onRegenerate: () => undefined,
    onRetry: () => undefined
  },
  decorators: [
    (Story) => (
      <div className="w-[560px] rounded-shell border border-line bg-surface p-6">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Step2SummaryPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    status: 'idle',
    content: '',
    sources: [],
    error: null,
    retriesRemaining: MAX_PREVIEW_RETRY
  }
};

export const Streaming: Story = {
  args: {
    status: 'streaming',
    content: '## 결제 실패 처리 흐름 정리\n\n- CheckoutErrorBoundary 에서 3DS/PG',
    sources: [],
    error: null,
    retriesRemaining: MAX_PREVIEW_RETRY
  }
};

export const Done: Story = {
  args: {
    status: 'done',
    content: sampleContent,
    sources: sampleSources,
    error: null,
    retriesRemaining: MAX_PREVIEW_RETRY
  }
};

export const ErrorWithRetries: Story = {
  args: {
    status: 'error',
    content: '',
    sources: [],
    error: { message: '요약 서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.' },
    retriesRemaining: 2
  }
};

export const RetriesExhausted: Story = {
  args: {
    status: 'canceled',
    content: '',
    sources: [],
    error: { message: '요약 실패' },
    retriesRemaining: 0
  }
};
