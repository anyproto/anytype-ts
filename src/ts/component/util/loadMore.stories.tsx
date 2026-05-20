import type { Meta, StoryObj } from '@storybook/react';
import LoadMore from './loadMore';

const meta: Meta<typeof LoadMore> = {
	title: 'Util/LoadMore',
	component: LoadMore,
	tags: ['autodocs'],
	argTypes: {
		limit: { control: { type: 'number', min: 1 } },
		loaded: { control: { type: 'number', min: 0 } },
		total: { control: { type: 'number', min: 0 } },
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		limit: 10,
		loaded: 10,
		total: 50,
	},
};

export const FewRemaining: Story = {
	args: {
		limit: 10,
		loaded: 45,
		total: 50,
	},
};

export const LargeLimit: Story = {
	args: {
		limit: 50,
		loaded: 50,
		total: 200,
	},
};
