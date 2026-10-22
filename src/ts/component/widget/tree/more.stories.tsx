import type { Meta, StoryObj } from '@storybook/react';
import { withWidget } from '../../../../../.storybook/decorators';
import TreeItemMore from './more';

const meta: Meta<typeof TreeItemMore> = {
	title: 'Widget/Tree/More',
	component: TreeItemMore,
	tags: ['autodocs'],
	decorators: [
		withWidget('widgetTree'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: 'storybook-tree-parent-more',
		parentId: 'storybook-tree-parent',
		rootId: 'storybook-tree-root',
		treeKey: 'storybook-tree-more',
		branch: '-more',
		depth: 1,
		numChildren: 0,
		isMore: true,
		onMore: () => {},
	},
};

export const Nested: Story = {
	args: {
		...Default.args,
		depth: 3,
	},
};
