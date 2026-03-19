import type { Meta, StoryObj } from '@storybook/react';
import EmptySearch from './emptySearch';

const meta: Meta<typeof EmptySearch> = {
	title: 'Util/EmptySearch',
	component: EmptySearch,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};

export const WithFilter: Story = {
	args: {
		filter: 'missing item',
	},
};

export const CustomText: Story = {
	args: {
		text: 'No results match your search criteria.',
	},
};

export const Readonly: Story = {
	args: {
		filter: 'something',
		readonly: true,
	},
};
