import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../../.storybook/decorators';
import BlockFile from './file';
import * as I from 'Interface';
import * as M from 'Model';

const ROOT = 'sb-file';

const makeBlock = (id: string, state: number, targetObjectId = '') => new M.Block({
	id,
	type: I.BlockType.File,
	content: { state, style: I.FileStyle.Auto, targetObjectId },
	childrenIds: [],
	fields: {},
});

const meta: Meta<typeof BlockFile> = {
	title: 'Block/Media/File',
	component: BlockFile,
	tags: ['autodocs'],
	decorators: [
		withBlock(U.Data.blockClass(makeBlock('_', I.FileState.Done))),
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
		block: makeBlock('file-done', I.FileState.Done, 'file-obj-1'),
	},
};

export const Empty: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('file-empty', I.FileState.Empty),
	},
};

export const Error: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('file-error', I.FileState.Error),
	},
};
