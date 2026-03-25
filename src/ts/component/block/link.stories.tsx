import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { I, S } from 'Lib';
import { withBlock } from '../../../../.storybook/decorators';
import BlockLink from './link';

const ROOT = 'sb-link';

const meta: Meta<typeof BlockLink> = {
	title: 'Block/Link',
	component: BlockLink,
	tags: ['autodocs'],
	decorators: [
		withBlock('blockLink'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

const setup = (targetId: string, details: any) => {
	S.Detail.update(ROOT, { id: targetId, details }, false);
};

const makeBlock = (id: string, targetBlockId: string, cardStyle: number, extra: any = {}) => ({
	id,
	type: I.BlockType.Link,
	content: {
		targetBlockId,
		cardStyle,
		iconSize: extra.iconSize ?? I.LinkIconSize.Small,
		description: extra.description ?? I.LinkDescription.None,
		relations: extra.relations || [],
		...extra,
	},
	childrenIds: [],
	bgColor: extra.bgColor || '',
	fields: {},
	getTargetObjectId: () => targetBlockId,
});

export const TextStyle: Story = {
	decorators: [
		(Story) => {
			setup('link-obj-1', { name: 'My Document', layout: I.ObjectLayout.Page, type: 'type-page' });
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
		getWrapperWidth: () => 600,
		block: makeBlock('link-text', 'link-obj-1', I.LinkCardStyle.Text),
	},
};

export const CardStyle: Story = {
	decorators: [
		(Story) => {
			setup('link-obj-2', { name: 'Project Plan', description: 'Q1 roadmap for the product team', layout: I.ObjectLayout.Page, type: 'type-page' });
			setup('type-page', { name: 'Page', layout: I.ObjectLayout.Type });
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
		getWrapperWidth: () => 600,
		block: makeBlock('link-card', 'link-obj-2', I.LinkCardStyle.Card, {
			description: I.LinkDescription.Added,
			relations: ['type'],
		}),
	},
};

export const DeletedObject: Story = {
	decorators: [
		(Story) => {
			setup('link-obj-del', { name: 'Gone', isDeleted: true, layout: I.ObjectLayout.Page });
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
		getWrapperWidth: () => 600,
		block: makeBlock('link-del', 'link-obj-del', I.LinkCardStyle.Card),
	},
};

export const TaskDone: Story = {
	decorators: [
		(Story) => {
			setup('link-obj-task', { name: 'Ship v2.0', layout: I.ObjectLayout.Task, done: true, type: 'type-task' });
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
		getWrapperWidth: () => 600,
		block: makeBlock('link-task', 'link-obj-task', I.LinkCardStyle.Card, {
			iconSize: I.LinkIconSize.Medium,
		}),
	},
};
