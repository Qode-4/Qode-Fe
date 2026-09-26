import type { Meta, StoryObj } from '@storybook/react-vite';
import { StateMessage } from './StateMessage';
import { Spinner } from './Spinner';

const meta = {
  title: 'Components/UI/StateMessage',
  component: StateMessage,
  tags: ['autodocs'],
  args: { kind: 'loading', children: '멤버를 불러오는 중…' }
} satisfies Meta<typeof StateMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {};

/** 사용자가 채울 수 있는 빈 상태 — 다음 행동 한 줄 */
export const EmptyWithAction: Story = {
  args: {
    kind: 'empty',
    children: '아직 채팅이 없어요.',
    action: '＋ 를 눌러 코드에 질문해 보세요.'
  }
};

/** 할 수 있는 게 없는 빈 상태 — 무엇이 없는지만 */
export const EmptyOnly: Story = { args: { kind: 'empty', children: '검색 결과가 없어요.' } };

export const Spinners: Story = {
  render: () => (
    <div className="flex items-center gap-6 text-fg-muted">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" tone="brand" />
    </div>
  )
};
