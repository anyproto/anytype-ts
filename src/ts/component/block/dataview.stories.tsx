import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import BlockDataview from './dataview';
import * as I from 'Interface';
import * as M from 'Model';

const meta: Meta<typeof BlockDataview> = {
	title: 'Block/Dataview',
	component: BlockDataview,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'root',
		block: new M.Block({ id: 'dataview-block', type: I.BlockType.Dataview, childrenIds: [], content: {} }),
		readonly: false,
		isPopup: false,
		getWrapperWidth: () => 800,
	},
};
