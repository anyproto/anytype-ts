import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../../.storybook/decorators';
import BlockPdf from './pdf';
import * as I from 'Interface';
import * as M from 'Model';

const ROOT = 'sb-pdf';

const makeBlock = (id: string, state: number, targetObjectId = '', width = 0) => new M.Block({
	id,
	type: I.BlockType.File,
	content: { state, targetObjectId },
	childrenIds: [],
	fields: { width },
});

const meta: Meta<typeof BlockPdf> = {
	title: 'Block/Media/PDF',
	component: BlockPdf,
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
			S.Detail.update(ROOT, { id: 'pdf-obj-1', details: {
				name: 'annual-report.pdf',
				sizeInBytes: 5242880,
				layout: I.ObjectLayout.Pdf,
				isDeleted: false,
			}}, false);
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('pdf-done', I.FileState.Done, 'pdf-obj-1', 0.9),
	},
};

export const Empty: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('pdf-empty', I.FileState.Empty),
	},
};

export const Error: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('pdf-error', I.FileState.Error),
	},
};
