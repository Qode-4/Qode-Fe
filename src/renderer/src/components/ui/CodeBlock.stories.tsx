import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodeBlock } from './CodeBlock';
import { ToastProvider } from './ToastProvider';

const meta = {
  title: 'Components/UI/CodeBlock',
  component: CodeBlock,
  tags: ['autodocs'],
  args: {
    language: 'ts',
    code: `export const extractVideoId = (url: string): string | null => {
  const match = url.match(/(?:v=|youtu\\.be\\/)([\\w-]{11})/);
  return match?.[1] ?? null;
};`
  },
  decorators: [
    (Story) => (
      <ToastProvider>
        <div className="w-[560px]">
          <Story />
        </div>
      </ToastProvider>
    )
  ]
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 긴 줄은 블록 안에서 가로 스크롤 — 카드·모달을 밀지 않는다 */
export const LongLine: Story = {
  args: {
    language: 'bash',
    code: 'npx electron-builder --mac --arm64 --config electron-builder.yml --publish never -c.mac.identity=null -c.afterPack=scripts/afterPackMac.js'
  }
};
