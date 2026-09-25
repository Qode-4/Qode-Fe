import type { Meta, StoryObj } from '@storybook/react-vite';
import { SourceList } from './SourceList';

/** 스크린샷 사례(참조 10건 → 파일 6개)를 그대로 옮긴 샘플 */
const sample = [
  { filePath: 'package.json', startLine: 1, endLine: 21 },
  { filePath: 'components/onboarding/first-run-modal.tsx', startLine: 366, endLine: 393 },
  { filePath: 'utils/ai-action-plan.ts', startLine: 92, endLine: 128 },
  { filePath: 'components/ai/command-palette.tsx', startLine: 612, endLine: 633 },
  { filePath: 'package.json', startLine: 85, endLine: 133 },
  { filePath: 'scripts/afterPackMac.js', startLine: 64, endLine: 80 },
  { filePath: 'scripts/afterPackMac.js', startLine: 3, endLine: 23 },
  { filePath: 'scripts/afterPackMac.js', startLine: 47, endLine: 65 },
  { filePath: 'components/window.tsx', startLine: 385, endLine: 412 }
];

const meta = {
  title: 'Components/UI/SourceList',
  component: SourceList,
  tags: ['autodocs'],
  args: { sources: sample },
  decorators: [
    (Story) => (
      <div className="w-[560px] bg-canvas p-4">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof SourceList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Collapsed: Story = { args: { defaultExpanded: false } };

/** 모달처럼 세로 공간이 제한된 곳 */
export const WithMaxHeight: Story = { args: { maxHeight: '96px' } };

export const ManyRanges: Story = {
  args: {
    sources: [5, 40, 88, 120, 300].map((start) => ({
      filePath: 'src/renderer/src/components/layout/AppShell.tsx',
      startLine: start,
      endLine: start + 12
    }))
  }
};

export const LongPaths: Story = {
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    )
  ],
  args: {
    sources: [
      {
        filePath:
          'src/renderer/src/components/feature/teamChat/very/deeply/nested/InviteTeamChatMembersModal.tsx',
        startLine: 10,
        endLine: 42
      },
      { filePath: 'README.md', startLine: null, endLine: null }
    ]
  }
};
