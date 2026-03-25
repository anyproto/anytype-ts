import type { Meta, StoryObj } from '@storybook/react';
import { withHeader } from '../../../../../.storybook/decorators';
import HeaderAuthLogout from './logout';

const meta: Meta<typeof HeaderAuthLogout> = {
	title: 'Header/AuthLogout',
	component: HeaderAuthLogout,
	tags: ['autodocs'],
	decorators: [ withHeader('authLogout') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
