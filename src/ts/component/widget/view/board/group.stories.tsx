import type { Meta, StoryObj } from '@storybook/react';
import { withWidgetView } from '../../../../../../.storybook/decorators';
import Group from './group';

const meta: Meta<typeof Group> = {
	title: 'Widget/View/Board/Group',
	component: Group,
	tags: ['autodocs'],
	decorators: [
		withWidgetView('viewBoard'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: 'storybook-board-group',
		value: 'Group Name',
		rootId: 'storybook-root',
		block: { id: 'storybook-block' } as any,
		searchIds: [],
		getView: () => ({} as any),
		getViewLimit: () => 10,
		getObject: () => ({} as any),
		getContentParam: () => ({ layout: 4, limit: 10, viewId: '' }),
		onCreate: () => {},
	},
};

export const WithCreate: Story = {
	args: {
		...Default.args,
		canCreate: true,
	},
};
