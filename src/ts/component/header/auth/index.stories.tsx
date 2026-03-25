import type { Meta, StoryObj } from '@storybook/react';
import { withHeader } from '../../../../../.storybook/decorators';
import HeaderAuth from './index';

const meta: Meta<typeof HeaderAuth> = {
	title: 'Header/Auth',
	component: HeaderAuth,
	tags: ['autodocs'],
	decorators: [ withHeader('authIndex') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};

export const WithBackHandler: Story = {
	args: {
		onBack: () => {},
	},
};
