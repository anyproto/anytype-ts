import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { I, S } from 'Lib';
import BlockPdf from './pdf';

const ROOT = 'sb-pdf';

const meta: Meta<typeof BlockPdf> = {
	title: 'Block/Media/PDF',
	component: BlockPdf,
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
		block: {
			id: 'pdf-done',
			type: I.BlockType.File,
			content: { state: I.FileState.Done, targetObjectId: 'pdf-obj-1' },
			childrenIds: [],
			fields: { width: 0.9 },
		},
	},
};

export const Empty: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: {
			id: 'pdf-empty',
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
			id: 'pdf-error',
			type: I.BlockType.File,
			content: { state: I.FileState.Error, targetObjectId: '' },
			childrenIds: [],
			fields: {},
		},
	},
};
