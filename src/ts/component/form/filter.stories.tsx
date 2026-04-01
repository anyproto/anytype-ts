import type { Meta, StoryObj } from '@storybook/react';
import Filter from './filter';

const meta: Meta<typeof Filter> = {
	title: 'Form/Filter',
	component: Filter,
	tags: ['autodocs'],
	argTypes: {
		size: {
			control: { type: 'select' },
			options: [ 28, 32, 36 ],
			table: { type: { summary: '28 | 32 | 36' } },
		},
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		placeholder: 'Filter...',
	},
};

export const Size28: Story = {
	args: {
		placeholder: 'Size 28 (default)',
		size: 28,
	},
};

export const Size32: Story = {
	args: {
		placeholder: 'Size 32',
		size: 32,
	},
};

export const Size36: Story = {
	args: {
		placeholder: 'Size 36',
		size: 36,
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
		iconParam: { name: 'common/search' },
		placeholder: 'Search...',
	},
};

export const FocusOnMount: Story = {
	args: {
		placeholder: 'Auto-focused filter',
		focusOnMount: true,
	},
};
