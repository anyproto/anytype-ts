import type { Meta, StoryObj } from '@storybook/react';
import Filter from './filter';

const meta: Meta<typeof Filter> = {
	title: 'Form/Filter',
	component: Filter,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		placeholder: 'Filter...',
	},
};

export const WithValue: Story = {
	args: {
		value: 'search term',
		placeholder: 'Filter...',
	},
};

export const WithIcon: Story = {
	args: {
		icon: 'search',
		placeholder: 'Search...',
	},
};

export const FocusOnMount: Story = {
	args: {
		placeholder: 'Auto-focused filter',
		focusOnMount: true,
	},
};
