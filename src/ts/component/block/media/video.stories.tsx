import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../../.storybook/decorators';
import BlockVideo from './video';
import * as I from 'Interface';
import * as M from 'Model';

const ROOT = 'sb-video';

const makeBlock = (id: string, state: number, targetObjectId = '', width = 0) => new M.Block({
	id,
	type: I.BlockType.File,
	content: { state, targetObjectId },
	childrenIds: [],
	fields: { width },
});

const meta: Meta<typeof BlockVideo> = {
	title: 'Block/Media/Video',
	component: BlockVideo,
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
		block: makeBlock('vid-done', I.FileState.Done, 'vid-obj-1', 0.75),
	},
};

export const Empty: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('vid-empty', I.FileState.Empty),
	},
};

export const Error: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('vid-error', I.FileState.Error),
	},
};
