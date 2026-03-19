import type { Meta, StoryObj } from '@storybook/react';
import Pager from './pager';

const meta: Meta<typeof Pager> = {
	title: 'Util/Pager',
	component: Pager,
	tags: ['autodocs'],
	argTypes: {
		offset: { control: { type: 'number', min: 0 } },
		limit: { control: { type: 'number', min: 1 } },
		total: { control: { type: 'number', min: 0 } },
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const FirstPage: Story = {
	args: {
		offset: 0,
		limit: 10,
		total: 100,
	},
};

export const MiddlePage: Story = {
	args: {
		offset: 40,
		limit: 10,
		total: 100,
	},
};

export const LastPage: Story = {
	args: {
		offset: 90,
		limit: 10,
		total: 100,
	},
};

export const FewPages: Story = {
	args: {
		offset: 0,
		limit: 10,
		total: 30,
	},
};

export const ShortMode: Story = {
	args: {
		offset: 20,
		limit: 10,
		total: 100,
		isShort: true,
	},
};

export const ManyPages: Story = {
	args: {
		offset: 50,
		limit: 5,
		total: 500,
	},
};
