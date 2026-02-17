import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from './Link';

const meta = {
  title: 'Components/UI/Link',
  component: Link,
  tags: ['autodocs'],
  args: {
    to: '/projects/123',
    children: '프로젝트로 이동'
  },
  argTypes: {
    className: { control: false }
  }
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const InteractivePreview = (args: React.ComponentProps<typeof Link>): React.JSX.Element => {
  const [hash, setHash] = useState(window.location.hash || '#/');

  useEffect(() => {
    const onHashChange = (): void => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <div className="space-y-2">
      <Link {...args} />
      <p className="text-sm text-text-subtle">
        현재 hash: <code>{hash}</code>
      </p>
    </div>
  );
};

export const Interactive: Story = {
  render: (args) => <InteractivePreview {...args} />
};
