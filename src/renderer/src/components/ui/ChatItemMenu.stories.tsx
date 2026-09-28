import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatItemMenu } from './ChatItemMenu';

/** 사이드바 채팅 항목의 ⋯ 메뉴와 같은 구성 */
const meta = {
  title: 'Components/UI/ChatItemMenu',
  component: ChatItemMenu,
  tags: ['autodocs'],
  args: {
    triggerAriaLabel: '채팅 메뉴 열기',
    ariaLabel: '채팅 작업 메뉴',
    triggerClassName:
      'inline-flex h-6 w-6 items-center justify-center rounded-inline text-fg-muted transition-colors hover:bg-line',
    actions: [
      { key: 'rename', label: '이름 바꾸기', iconName: 'Pencil_light', onSelect: () => undefined },
      { key: 'invite', label: '멤버 초대', iconName: 'Add_round_light', onSelect: () => undefined },
      {
        key: 'delete',
        label: '삭제',
        iconName: 'Trash_light',
        danger: true,
        onSelect: () => undefined
      }
    ]
  },
  decorators: [
    (Story) => (
      <div className="flex h-[200px] w-[280px] items-start justify-between rounded-control bg-sidebar p-2 text-label">
        <span className="truncate px-1 py-0.5">이 프로젝트에서 유튜브 임베딩…</span>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof ChatItemMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 권한이 없어 일부 항목이 비활성인 경우 */
export const WithDisabled: Story = {
  args: {
    actions: [
      { key: 'rename', label: '이름 바꾸기', iconName: 'Pencil_light', onSelect: () => undefined },
      {
        key: 'delete',
        label: '삭제 (OWNER만 가능)',
        iconName: 'Trash_light',
        danger: true,
        disabled: true,
        onSelect: () => undefined
      }
    ]
  }
};
