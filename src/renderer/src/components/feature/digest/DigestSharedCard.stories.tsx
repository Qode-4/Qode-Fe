import type { Meta, StoryObj } from '@storybook/react-vite';
import { DigestSharedCard } from './DigestSharedCard';

const sampleContent = `## 결제 실패 처리 흐름 요약

- \`CheckoutErrorBoundary\` 에서 3DS/PG 오류 코드를 friendly 메시지로 변환한다.
- axios interceptor 는 5xx/네트워크 오류에 한해 지수 백오프로 최대 3회 재시도한다.

## 확인이 필요한 부분

- [ ] 카드사 코드 매핑 테이블 최신화 여부
- [ ] 4xx 재시도 정책 재검토`;

const sampleSources = [
  { filePath: 'src/renderer/src/pages/CheckoutPage.tsx', startLine: 88, endLine: 132, snippet: '' },
  { filePath: 'src/renderer/src/api/apiClient.ts', startLine: 34, endLine: 40, snippet: '' }
];

const meta = {
  title: 'Components/Feature/Digest/DigestSharedCard',
  component: DigestSharedCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[640px] bg-surface-muted p-6">
        <Story />
      </div>
    )
  ],
  args: {
    content: sampleContent,
    sources: sampleSources,
    senderName: '정예지',
    createdAt: '2026-09-19T14:32:00Z',
    isMe: false,
    hasSourceLink: true,
    onOpenSource: () => undefined,
    onDeleteShare: () => undefined
  }
} satisfies Meta<typeof DigestSharedCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OtherSharer: Story = {};

export const MySharer: Story = {
  args: {
    isMe: true
  }
};

export const NoSources: Story = {
  args: {
    sources: []
  }
};

export const NoSourceLink: Story = {
  args: {
    hasSourceLink: false
  }
};

export const Deleting: Story = {
  args: {
    isMe: true,
    isDeleting: true
  }
};
