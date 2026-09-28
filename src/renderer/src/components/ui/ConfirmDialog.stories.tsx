import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConfirmDialog } from './ConfirmDialog';

const meta = {
  title: 'Components/UI/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  args: {
    open: true,
    title: '‘이 프로젝트에서 유튜브 임베딩…’ 채팅을 삭제할까요?',
    description: '대화 내용이 모두 사라져요.',
    confirmLabel: '삭제',
    onClose: () => undefined,
    onConfirm: () => undefined
  }
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 나에게만 영향 + 잃는 게 적음 */
export const Simple: Story = {};

/** 다른 사람에게 영향 or 잃는 게 큼 */
export const Emphasis: Story = {
  args: {
    title: '‘캠스터디’ 프로젝트를 삭제할까요?',
    description: '멤버 전원이 이 프로젝트와 그 안의 대화에 더 이상 접근할 수 없어요.',
    emphasis: true
  }
};

export const Processing: Story = { args: { isProcessing: true } };
