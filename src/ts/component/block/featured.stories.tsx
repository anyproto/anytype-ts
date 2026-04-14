import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../.storybook/decorators';
import BlockFeatured from './featured';
import * as I from 'Interface';
import * as M from 'Model';

const ROOT = 'sb-featured';

const makeBlock = (id: string) => new M.Block({
	id,
	type: I.BlockType.Featured,
	childrenIds: [],
	content: {},
});

const meta: Meta<typeof BlockFeatured> = {
	title: 'Block/Featured',
	component: BlockFeatured,
	tags: ['autodocs'],
	decorators: [ withBlock('blockFeatured') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	decorators: [
		(Story) => {
			S.Detail.update(ROOT, { id: ROOT, details: {
				type: 'ot-page',
				layout: I.ObjectLayout.Page,
			}}, false);
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('featured-default'),
	},
};
