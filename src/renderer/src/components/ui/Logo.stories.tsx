import type { Meta, StoryObj } from '@storybook/react-vite';
import { Logo } from './Logo';

const meta = {
  title: 'Components/UI/Logo',
  component: Logo,
  tags: ['autodocs'],
  args: { variant: 'lockup', size: 'sm' },
  argTypes: {
    variant: { options: ['lockup', 'mark', 'wordmark'], control: { type: 'inline-radio' } },
    size: { options: ['sm', 'md'], control: { type: 'inline-radio' } },
    className: { control: false }
  }
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** variant × size. 사이드바 = lockup sm, 인증 화면 = lockup md */
export const Matrix: Story = {
  render: () => (
    <div className="grid grid-cols-[auto_auto_auto] items-center gap-x-8 gap-y-4 text-caption text-fg-muted">
      <span />
      <span>sm (사이드바)</span>
      <span>md (인증 화면)</span>
      {(['lockup', 'mark', 'wordmark'] as const).map((v) => (
        <div key={v} className="contents">
          <span>{v}</span>
          <Logo variant={v} size="sm" />
          <Logo variant={v} size="md" />
        </div>
      ))}
    </div>
  )
};
