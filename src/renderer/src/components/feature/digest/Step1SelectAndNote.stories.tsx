import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Step1SelectAndNote, type Step1PairItem } from './Step1SelectAndNote';

const samplePairs: Step1PairItem[] = [
  {
    messageId: 'm-1',
    question: '결제 흐름에서 3D Secure 실패 시 사용자에게 어떤 메시지가 뜨는지?',
    answerPreview:
      '3DS 실패 시 CheckoutErrorBoundary 가 오류 코드를 파싱해 friendly 메시지로 변환한 뒤 결제 페이지 상단 배너로 노출합니다. 카드사 오류 코드가 있으면 문구가 달라집니다.'
  },
  {
    messageId: 'm-2',
    question: 'PG 연동 재시도 정책 좀 정리해줘',
    answerPreview:
      'axios interceptor 에서 5xx / network 에러에 한해 지수 백오프로 최대 3회 재시도합니다. 4xx 는 재시도하지 않습니다.'
  },
  {
    messageId: 'm-3',
    question: '주문 취소 API 호출 위치는?',
    answerPreview:
      'OrderDetailPage 의 케밥 메뉴 → useCancelOrder mutation. 성공 시 주문 리스트 쿼리를 invalidate 합니다.'
  }
];

const meta = {
  title: 'Components/Feature/Digest/Step1SelectAndNote',
  component: Step1SelectAndNote,
  tags: ['autodocs'],
  parameters: { layout: 'centered' }
} satisfies Meta<typeof Step1SelectAndNote>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrapper = ({ initialSelected }: { initialSelected: string[] }): React.JSX.Element => {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [note, setNote] = useState('');
  return (
    <div className="w-[560px] rounded-2xl border border-line bg-surface p-6">
      <Step1SelectAndNote
        pairs={samplePairs}
        selectedIds={selected}
        note={note}
        onNoteChange={setNote}
        onToggle={(id) => {
          setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
              if (next.size <= 1) return prev;
              next.delete(id);
            } else {
              next.add(id);
            }
            return next;
          });
        }}
      />
    </div>
  );
};

export const AllSelected: Story = {
  render: () => <Wrapper initialSelected={['m-1', 'm-2', 'm-3']} />
};

export const OnlyOneSelected: Story = {
  render: () => <Wrapper initialSelected={['m-2']} />
};

export const EmptyList: Story = {
  render: () => (
    <div className="w-[560px] rounded-2xl border border-line bg-surface p-6">
      <Step1SelectAndNote
        pairs={[]}
        selectedIds={new Set()}
        note=""
        onToggle={() => undefined}
        onNoteChange={() => undefined}
      />
    </div>
  )
};
