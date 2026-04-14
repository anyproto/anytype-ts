import type { Meta, StoryObj } from '@storybook/react';
import { withHeader } from '../../../../../.storybook/decorators';
import HeaderMainChat from './chat';

const meta: Meta<typeof HeaderMainChat> = {
	title: 'Header/Main/Chat',
	component: HeaderMainChat,
	tags: ['autodocs'],
	decorators: [ withHeader('mainChat') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
