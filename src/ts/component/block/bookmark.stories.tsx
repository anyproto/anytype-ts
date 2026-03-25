import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { I, S } from 'Lib';
import BlockBookmark from './bookmark';

const ROOT = 'sb-bookmark';

const meta: Meta<typeof BlockBookmark> = {
	title: 'Block/Bookmark',
	component: BlockBookmark,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 600, padding: 16 }}>
				<Story />
			</div>
		),
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
		block: {
			id: 'bm-done',
			type: I.BlockType.Bookmark,
			content: {
				state: I.BookmarkState.Done,
				targetObjectId: 'bm-target-1',
				url: 'https://anytype.io',
			},
			childrenIds: [],
			bgColor: '',
		},
	},
};

export const Empty: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		getWrapperWidth: () => 600,
		block: {
			id: 'bm-empty',
			type: I.BlockType.Bookmark,
			content: {
				state: I.BookmarkState.Empty,
				targetObjectId: '',
				url: '',
			},
			childrenIds: [],
			bgColor: '',
		},
	},
};

export const Fetching: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		getWrapperWidth: () => 600,
		block: {
			id: 'bm-fetching',
			type: I.BlockType.Bookmark,
			content: {
				state: I.BookmarkState.Fetching,
				targetObjectId: '',
				url: 'https://anytype.io',
			},
			childrenIds: [],
			bgColor: '',
		},
	},
};

export const Error: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		getWrapperWidth: () => 600,
		block: {
			id: 'bm-error',
			type: I.BlockType.Bookmark,
			content: {
				state: I.BookmarkState.Error,
				targetObjectId: '',
				url: 'https://invalid-url',
			},
			childrenIds: [],
			bgColor: '',
		},
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
		block: {
			id: 'bm-del',
			type: I.BlockType.Bookmark,
			content: {
				state: I.BookmarkState.Done,
				targetObjectId: 'bm-target-del',
				url: '',
			},
			childrenIds: [],
			bgColor: '',
		},
	},
};
