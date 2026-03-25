import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { I, S } from 'Lib';
import BlockVideo from './video';

const ROOT = 'sb-video';

const meta: Meta<typeof BlockVideo> = {
	title: 'Block/Media/Video',
	component: BlockVideo,
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

export const Done: Story = {
	decorators: [
		(Story) => {
			S.Detail.update(ROOT, { id: 'vid-obj-1', details: {
				name: 'demo.mp4',
				layout: I.ObjectLayout.Video,
				isDeleted: false,
			}}, false);
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
		block: {
			id: 'vid-done',
			type: I.BlockType.File,
			content: { state: I.FileState.Done, targetObjectId: 'vid-obj-1' },
			childrenIds: [],
			fields: { width: 0.75 },
		},
	},
};

export const Empty: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: {
			id: 'vid-empty',
			type: I.BlockType.File,
			content: { state: I.FileState.Empty, targetObjectId: '' },
			childrenIds: [],
			fields: {},
		},
	},
};

export const Error: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: {
			id: 'vid-error',
			type: I.BlockType.File,
			content: { state: I.FileState.Error, targetObjectId: '' },
			childrenIds: [],
			fields: {},
		},
	},
};
