import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { I, S } from 'Lib';
import { withBlock } from '../../../../../.storybook/decorators';
import BlockAudio from './audio';

const ROOT = 'sb-audio';

const meta: Meta<typeof BlockAudio> = {
	title: 'Block/Media/Audio',
	component: BlockAudio,
	tags: ['autodocs'],
	decorators: [
		withBlock('blockMedia isAudio'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Done: Story = {
	decorators: [
		(Story) => {
			S.Detail.update(ROOT, { id: 'audio-obj-1', details: {
				name: 'podcast-episode.mp3',
				fileExt: 'mp3',
				layout: I.ObjectLayout.Audio,
				isDeleted: false,
			}}, false);
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
		block: {
			id: 'audio-done',
			type: I.BlockType.File,
			content: { state: I.FileState.Done, targetObjectId: 'audio-obj-1' },
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
			id: 'audio-empty',
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
			id: 'audio-error',
			type: I.BlockType.File,
			content: { state: I.FileState.Error, targetObjectId: '' },
			childrenIds: [],
			fields: {},
		},
	},
};
