import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SuggestionCard } from './SuggestionCard';

const meta = {
  title: 'Components/UI/SuggestionCard',
  component: SuggestionCard,
  tags: ['autodocs'],
  args: {
    text: '이번주 새로운 업데이트 내용을 요약해줘.'
  },
  argTypes: {
    className: { control: false }
  },
  decorators: [
    (Story) => (
      <ul className="w-[406px] space-y-1">
        <Story />
      </ul>
    )
  ]
} satisfies Meta<typeof SuggestionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const List: Story = {
  render: (): React.JSX.Element => (
    <>
      <SuggestionCard text="이번주 새로운 업데이트 내용을 요약해줘." />
      <SuggestionCard text="이 기능에 대해 기획자가 고려해야할 부분을 정리해줘." />
      <SuggestionCard text="이 기능 구현 로직이 궁금해." />
      <SuggestionCard text="우리 서비스의 큰 기능들을 리스트업해줘." />
    </>
  )
};
