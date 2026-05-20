import type { Meta, StoryObj } from '@storybook/react';
import EmptyState from './emptyState';

const meta: Meta<typeof EmptyState> = {
	title: 'Util/EmptyState',
	component: EmptyState,
	tags: ['autodocs'],
	argTypes: {
		buttonColor: {
			control: 'select',
			options: ['blank', 'black', 'red', 'blue'],
		},
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		text: 'No items found',
	},
};

export const WithButton: Story = {
	args: {
		text: 'No objects yet',
		buttonText: 'Create New',
		buttonColor: 'black',
	},
};

export const CustomText: Story = {
	args: {
		text: 'Your collection is empty. Start by adding some items.',
		buttonText: 'Add Item',
		buttonColor: 'blank',
	},
};
