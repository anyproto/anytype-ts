import type { Meta, StoryObj } from '@storybook/react';
import WidgetListItem from './item';

const meta: Meta<typeof WidgetListItem> = {
	title: 'Widget/View/List/Item',
	component: WidgetListItem,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
