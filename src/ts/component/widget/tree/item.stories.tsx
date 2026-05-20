import type { Meta, StoryObj } from '@storybook/react';
import { withWidget } from '../../../../../.storybook/decorators';
import TreeItem from './item';

const meta: Meta<typeof TreeItem> = {
	title: 'Widget/Tree/Item',
	component: TreeItem,
	tags: ['autodocs'],
	decorators: [
		withWidget('widgetTree'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: 'storybook-tree-item',
		parentId: 'storybook-tree-parent',
		rootId: 'storybook-tree-root',
		treeKey: 'storybook-tree',
		branch: '',
		depth: 1,
		numChildren: 0,
		index: 0,
		getSubId: () => 'storybook-sub',
		getSubKey: () => 'storybook-sub-key',
		onClick: () => {},
		onToggle: () => {},
		onContext: () => {},
	},
};

export const WithChildren: Story = {
	args: {
		...Default.args,
		numChildren: 3,
	},
};

export const Nested: Story = {
	args: {
		...Default.args,
		depth: 3,
	},
};

export const Section: Story = {
	args: {
		...Default.args,
		isSection: true,
	},
};
