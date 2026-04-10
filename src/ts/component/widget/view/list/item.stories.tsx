import type { Meta, StoryObj } from '@storybook/react';
import { withWidgetView } from '../../../../../../.storybook/decorators';
import WidgetListItem from './item';

const meta: Meta<typeof WidgetListItem> = {
	title: 'Widget/View/List/Item',
	component: WidgetListItem,
	tags: ['autodocs'],
	decorators: [
		withWidgetView('viewList'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		subId: 'storybook-list-sub',
		id: 'storybook-list-item',
		block: { id: 'storybook-block' } as any,
		onContext: () => {},
	},
};

export const Compact: Story = {
	decorators: [
		withWidgetView('viewList', 'isCompact'),
	],
	args: {
		...Default.args,
		isCompact: true,
	},
};

export const Section: Story = {
	args: {
		...Default.args,
		isSection: true,
	},
};
