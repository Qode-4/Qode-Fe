import type { Meta, StoryObj } from '@storybook/react-vite';
import type { DigestSourceResponse } from '../../../api/contracts/digest';
import { OverlayModal } from '../../ui/OverlayModal';
import { DigestSourceViewBody } from './DigestSourceViewBody';

const sampleSource: DigestSourceResponse = {
  note: '결제 흐름 정리했어요. 확인 부탁해요.',
  sharedAt: '2026-09-19T14:32:00Z',
  pairs: [
    {
      questionMessageId: 'q-1',
      question: '결제 실패 흐름 정리해줘',
      answerMessageId: 'a-1',
      answer:
        '## 결제 실패 처리\n\n- CheckoutErrorBoundary 에서 3DS/PG 오류 코드를 friendly 메시지로 변환한다.\n- axios interceptor 는 5xx/네트워크 오류에 한해 지수 백오프로 최대 3회 재시도한다.',
      sources: [
        {
          filePath: 'src/renderer/src/pages/CheckoutPage.tsx',
          startLine: 88,
          endLine: 132,
          snippet: ''
        },
        {
          filePath: 'src/renderer/src/api/apiClient.ts',
          startLine: 34,
          endLine: 40,
          snippet: ''
        }
      ]
    },
    {
      questionMessageId: 'q-2',
      question: '주문 취소 API는 어디서 호출해?',
      answerMessageId: 'a-2',
      answer:
        'OrderDetailPage 케밥 메뉴에서 useCancelOrder mutation 을 호출합니다. 성공 시 주문 리스트 쿼리를 invalidate 합니다.',
      sources: []
    }
  ]
};

// 컨테이너(hook + OverlayModal) 대신 Body 만 OverlayModal 로 감싸 상태별 스토리를 노출한다.
type BodyStoryArgs = React.ComponentProps<typeof DigestSourceViewBody>;

const Wrap = (args: BodyStoryArgs): React.JSX.Element => (
  <OverlayModal open onClose={() => undefined} title="원본 대화" size="xl">
    <DigestSourceViewBody {...args} />
  </OverlayModal>
);

const meta = {
  title: 'Components/Feature/Digest/DigestSourceView',
  render: (args) => <Wrap {...args} />,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' }
} satisfies Meta<BodyStoryArgs>;

export default meta;
type Story = StoryObj<BodyStoryArgs>;

export const Ready: Story = {
  args: {
    status: 'ready',
    source: sampleSource,
    sharerName: '정예지',
    sharedAt: '2026-09-19T14:32:00Z',
    onRetry: () => undefined,
    onClose: () => undefined
  }
};

export const NoNote: Story = {
  args: {
    status: 'ready',
    source: { ...sampleSource, note: null },
    sharerName: '정예지',
    sharedAt: '2026-09-19T14:32:00Z',
    onRetry: () => undefined,
    onClose: () => undefined
  }
};

export const Loading: Story = {
  args: {
    status: 'loading',
    source: undefined,
    sharerName: '정예지',
    sharedAt: '2026-09-19T14:32:00Z',
    onRetry: () => undefined,
    onClose: () => undefined
  }
};

export const ErrorState: Story = {
  args: {
    status: 'error',
    source: undefined,
    errorMessage: '원본 대화가 삭제됐거나 볼 수 없어요.',
    sharerName: '정예지',
    sharedAt: '2026-09-19T14:32:00Z',
    onRetry: () => undefined,
    onClose: () => undefined
  }
};

export const Empty: Story = {
  args: {
    status: 'ready',
    source: { ...sampleSource, pairs: [] },
    sharerName: '정예지',
    sharedAt: '2026-09-19T14:32:00Z',
    onRetry: () => undefined,
    onClose: () => undefined
  }
};
