import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../.storybook/decorators';
import BlockCover from './cover';
import * as I from 'Interface';
import * as M from 'Model';

const ROOT = 'sb-cover';

const makeBlock = (id: string) => new M.Block({
	id,
	type: I.BlockType.Cover,
	childrenIds: [],
	content: {},
});

const meta: Meta<typeof BlockCover> = {
	title: 'Block/Cover',
	component: BlockCover,
	tags: ['autodocs'],
	decorators: [ withBlock('blockCover') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const NoCover: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('cover-none'),
	},
};

export const WithCover: Story = {
	decorators: [
		(Story) => {
			S.Detail.update(ROOT, { id: ROOT, details: {
				coverType: 1,
				coverId: 'test',
			}}, false);
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('cover-image'),
	},
};
