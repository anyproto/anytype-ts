import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../../.storybook/decorators';
import BlockLoader from './loader';
import * as I from 'Interface';
import * as M from 'Model';

const ROOT = 'sb-loader';

const makeBlock = (id: string, targetObjectId: string) => new M.Block({
	id,
	type: I.BlockType.File,
	childrenIds: [],
	content: { targetObjectId },
});

const meta: Meta<typeof BlockLoader> = {
	title: 'Block/Media/Loader',
	component: BlockLoader,
	tags: ['autodocs'],
	decorators: [ withBlock('blockMedia') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	decorators: [
		(Story) => {
			S.Detail.update(ROOT, { id: 'loader-obj-1', details: {
				name: 'Loading file...',
				isDeleted: false,
			}}, false);
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('loader-default', 'loader-obj-1'),
	},
};
