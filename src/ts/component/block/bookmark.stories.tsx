import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../.storybook/decorators';
import BlockBookmark from './bookmark';
import * as I from 'Interface';
import * as M from 'Model';

const ROOT = 'sb-bookmark';

const makeBlock = (id: string, state: number, targetObjectId = '', url = '') => new M.Block({
	id,
	type: I.BlockType.Bookmark,
	content: { state, targetObjectId, url },
	childrenIds: [],
	bgColor: '',
});

const meta: Meta<typeof BlockBookmark> = {
	title: 'Block/Bookmark',
	component: BlockBookmark,
	tags: ['autodocs'],
	decorators: [
		withBlock(U.Data.blockClass(makeBlock('_', I.BookmarkState.Done))),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

const setup = (blockId: string, targetId: string, details: any) => {
	S.Detail.update(ROOT, { id: targetId, details }, false);
};

export const Done: Story = {
	decorators: [
		(Story) => {
			setup('bm-done', 'bm-target-1', {
				name: 'Anytype – the everything app',
				description: 'Build apps, docs, and workflows. Own your data.',
				source: 'https://anytype.io',
				picture: '',
				iconImage: '',
			});
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
		getWrapperWidth: () => 600,
		block: makeBlock('bm-done', I.BookmarkState.Done, 'bm-target-1', 'https://anytype.io'),
	},
};

export const Empty: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		getWrapperWidth: () => 600,
		block: makeBlock('bm-empty', I.BookmarkState.Empty),
	},
};

export const Fetching: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		getWrapperWidth: () => 600,
		block: makeBlock('bm-fetching', I.BookmarkState.Fetching, '', 'https://anytype.io'),
	},
};

export const Error: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		getWrapperWidth: () => 600,
		block: makeBlock('bm-error', I.BookmarkState.Error, '', 'https://invalid-url'),
	},
};

export const Deleted: Story = {
	decorators: [
		(Story) => {
			setup('bm-del', 'bm-target-del', {
				name: 'Deleted Bookmark',
				isDeleted: true,
			});
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
		getWrapperWidth: () => 600,
		block: makeBlock('bm-del', I.BookmarkState.Done, 'bm-target-del'),
	},
};
