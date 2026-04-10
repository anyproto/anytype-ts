import type { Meta, StoryObj } from '@storybook/react';
import { withWidgetView } from '../../../../../../.storybook/decorators';
import WidgetBoardItem from './item';

const meta: Meta<typeof WidgetBoardItem> = {
	title: 'Widget/View/Board/Item',
	component: WidgetBoardItem,
	tags: ['autodocs'],
	decorators: [
		withWidgetView('viewBoard'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		subId: 'storybook-board-sub',
		id: 'storybook-board-item',
		block: { id: 'storybook-block' } as any,
		getView: () => ({} as any),
		onContext: () => {},
	},
};

export const HiddenIcon: Story = {
	args: {
		...Default.args,
		hideIcon: true,
	},
};
