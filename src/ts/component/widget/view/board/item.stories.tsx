import type { Meta, StoryObj } from '@storybook/react';
import WidgetBoardItem from './item';

const meta: Meta<typeof WidgetBoardItem> = {
	title: 'Widget/View/Board/Item',
	component: WidgetBoardItem,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
