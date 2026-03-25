import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { I, S } from 'Lib';
import BlockFile from './file';

const ROOT = 'sb-file';

const meta: Meta<typeof BlockFile> = {
	title: 'Block/Media/File',
	component: BlockFile,
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
			S.Detail.update(ROOT, { id: 'file-obj-1', details: {
				name: 'quarterly-report.pdf',
				sizeInBytes: 2048000,
				layout: I.ObjectLayout.File,
				fileExt: 'pdf',
				isDeleted: false,
			}}, false);
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
		block: {
			id: 'file-done',
			type: I.BlockType.File,
			content: { state: I.FileState.Done, style: I.FileStyle.Block, targetObjectId: 'file-obj-1' },
			childrenIds: [],
			fields: {},
		},
	},
};

export const Empty: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: {
			id: 'file-empty',
			type: I.BlockType.File,
			content: { state: I.FileState.Empty, style: I.FileStyle.Block, targetObjectId: '' },
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
			id: 'file-error',
			type: I.BlockType.File,
			content: { state: I.FileState.Error, style: I.FileStyle.Block, targetObjectId: '' },
			childrenIds: [],
			fields: {},
		},
	},
};
