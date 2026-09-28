import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AuthFrame } from './AuthFrame';
import { Button } from '../ui/Button';
import { Link } from '../ui/Link';
import { TextField } from '../ui/TextField';

const meta = {
  title: 'Components/Layout/AuthFrame',
  component: AuthFrame,
  tags: ['autodocs'],
  args: {
    title: '로그인',
    description: '팀 워크스페이스에 접속하세요.'
  }
} satisfies Meta<typeof AuthFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args): React.JSX.Element => (
    <div className="h-screen">
      <AuthFrame {...args} footer={<Link to="/signup">계정이 없나요? 회원가입</Link>}>
        <div className="space-y-3">
          <TextField label="이메일" placeholder="email@company.com" />
          <TextField label="비밀번호" type="password" placeholder="••••••••" />
          <Button className="w-full">로그인</Button>
        </div>
      </AuthFrame>
    </div>
  )
};

export const WithLongDescription: Story = {
  args: {
    title: '초대 수락',
    description: '초대 링크로 팀에 참여해요.\n먼저 가입이 필요할 수 있어요.'
  },
  render: (args): React.JSX.Element => (
    <div className="h-screen">
      <AuthFrame {...args} footer={<Link to="/login">이미 계정이 있어요</Link>}>
        <Button className="w-full">다음</Button>
      </AuthFrame>
    </div>
  )
};
