import type { Meta, StoryObj } from '@storybook/react';
import { withHeader } from '../../../../../.storybook/decorators';
import HeaderMainHistory from './history';

const meta: Meta<typeof HeaderMainHistory> = {
	title: 'Header/Main/History',
	component: HeaderMainHistory,
	tags: ['autodocs'],
	decorators: [ withHeader('mainHistory') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
