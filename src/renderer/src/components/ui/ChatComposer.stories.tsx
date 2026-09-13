import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatComposer } from './ChatComposer';

const meta = {
  title: 'Components/UI/ChatComposer',
  component: ChatComposer,
  tags: ['autodocs'],
  args: {
    value: '',
    placeholder: '메시지를 입력하세요...',
    disabled: false,
    canSend: false,
    isSending: false
  },
  argTypes: {
    onChange: { control: false },
    onSend: { action: 'send', control: false },
    onAttach: { action: 'attach', control: false },
    className: { control: false }
  }
} satisfies Meta<typeof ChatComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

const StatefulComposer = ({
  value: initialValue,
  ...args
}: React.ComponentProps<typeof ChatComposer>): React.JSX.Element => {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="w-[406px]">
      <ChatComposer
        {...args}
        value={value}
        canSend={value.trim().length > 0}
        onChange={setValue}
        onSend={args.onSend ?? (() => undefined)}
      />
    </div>
  );
};

export const Default: Story = {
  render: (args): React.JSX.Element => <StatefulComposer {...args} />
};

export const Sending: Story = {
  args: {
    value: '답변을 생성하고 있습니다...',
    canSend: false,
    isSending: true
  },
  render: (args): React.JSX.Element => (
    <div className="w-[406px]">
      <ChatComposer
        {...args}
        onChange={() => undefined}
        onSend={() => undefined}
        onAttach={() => undefined}
      />
    </div>
  )
};

export const MaxLength: Story = {
  args: {
    value: '가'.repeat(2000),
    canSend: true
  },
  render: (args): React.JSX.Element => <StatefulComposer {...args} />
};
