import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../../.storybook/decorators';
import BlockAudio from './audio';
import * as I from 'Interface';
import * as M from 'Model';

const ROOT = 'sb-audio';

const makeBlock = (id: string, state: number, targetObjectId = '') => new M.Block({
	id,
	type: I.BlockType.File,
	content: { state, targetObjectId },
	childrenIds: [],
	fields: {},
});

const meta: Meta<typeof BlockAudio> = {
	title: 'Block/Media/Audio',
	component: BlockAudio,
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
		block: makeBlock('audio-done', I.FileState.Done, 'audio-obj-1'),
	},
};

export const Empty: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('audio-empty', I.FileState.Empty),
	},
};

export const Error: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('audio-error', I.FileState.Error),
	},
};
