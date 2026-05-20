import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../../.storybook/decorators';
import BlockImage from './image';
import * as I from 'Interface';
import * as M from 'Model';

const ROOT = 'sb-image';

const makeBlock = (id: string, state: number, targetObjectId = '', width = 1) => new M.Block({
	id,
	type: I.BlockType.File,
	content: { state, targetObjectId },
	childrenIds: [],
	fields: { width },
});

const meta: Meta<typeof BlockImage> = {
	title: 'Block/Media/Image',
	component: BlockImage,
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
			S.Detail.update(ROOT, { id: 'img-obj-1', details: {
				name: 'screenshot.png',
				layout: I.ObjectLayout.Image,
				isDeleted: false,
				sizeInBytes: 512000,
			}}, false);
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('img-done', I.FileState.Done, 'img-obj-1', 0.8),
	},
};

export const HalfWidth: Story = {
	decorators: [
		(Story) => {
			S.Detail.update(ROOT, { id: 'img-obj-2', details: {
				name: 'photo.jpg',
				layout: I.ObjectLayout.Image,
				isDeleted: false,
			}}, false);
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('img-half', I.FileState.Done, 'img-obj-2', 0.5),
	},
};

export const Empty: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('img-empty', I.FileState.Empty),
	},
};

export const Error: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('img-error', I.FileState.Error),
	},
};
