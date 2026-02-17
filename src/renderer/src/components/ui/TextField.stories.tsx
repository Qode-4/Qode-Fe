import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from './TextField';

const meta = {
  title: 'Components/UI/TextField',
  component: TextField,
  tags: ['autodocs'],
  args: {
    label: '이메일',
    hint: '회사 이메일을 입력해주세요.',
    placeholder: 'email@company.com'
  },
  parameters: {
    controls: {
      include: ['label', 'hint', 'error', 'placeholder', 'disabled', 'type', 'value']
    }
  },
  argTypes: {
    className: { control: false },
    onBlur: { control: false },
    onChange: { control: false },
    onFocus: { control: false }
  }
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-[320px]">
      <TextField {...args} />
    </div>
  )
};

export const WithError: Story = {
  args: {
    error: '올바른 이메일 형식이 아닙니다.'
  },
  render: (args) => (
    <div className="w-[320px]">
      <TextField {...args} />
    </div>
  )
};

const StatefulExample = (): React.JSX.Element => {
  const [value, setValue] = useState('');

  return (
    <div className="w-[320px]">
      <TextField
        label="프로젝트 이름"
        value={value}
        placeholder="새 프로젝트"
        hint="2자 이상 입력해주세요."
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
};

export const Interactive: Story = {
  render: () => <StatefulExample />
};
