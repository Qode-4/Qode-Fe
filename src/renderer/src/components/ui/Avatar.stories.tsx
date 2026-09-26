import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './Avatar';

const meta = {
  title: 'Components/UI/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: { name: '테스트', size: 'md', tone: 'neutral' },
  argTypes: {
    kind: { options: ['user', 'ai'], control: { type: 'inline-radio' } },
    size: { options: ['sm', 'md', 'lg', 'xl'], control: { type: 'inline-radio' } },
    tone: { options: ['brand', 'neutral'], control: { type: 'inline-radio' } }
  }
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 종류 × 크기. 사진을 못 불러오면 이니셜로 자동 전환 */
export const Matrix: Story = {
  render: () => (
    <div className="grid grid-cols-[auto_repeat(4,auto)] items-center gap-x-6 gap-y-3 text-caption text-fg-muted">
      <span />
      <span>sm 24</span>
      <span>md 28</span>
      <span>lg 32</span>
      <span>xl 40</span>
      {(
        [
          ['user · neutral', { name: '테스트', tone: 'neutral' }],
          ['user · brand', { name: '제발', tone: 'brand' }],
          ['사진 실패 → 이니셜', { name: 'Qode', src: '/broken.png', tone: 'brand' }],
          ['ai', { kind: 'ai' }]
        ] as const
      ).map(([label, props]) => (
        <div key={label} className="contents">
          <span>{label}</span>
          {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <Avatar key={size} {...props} size={size} />
          ))}
        </div>
      ))}
    </div>
  )
};

/** 헤더처럼 겹쳐 쌓기 — ring 으로 구분, 남은 인원은 text */
export const Stack: Story = {
  render: () => (
    <div className="flex items-center -space-x-2">
      <Avatar name="제발" tone="brand" ring />
      <Avatar name="테스트" tone="brand" ring />
      <Avatar text="+3" tone="neutral" ring />
    </div>
  )
};
