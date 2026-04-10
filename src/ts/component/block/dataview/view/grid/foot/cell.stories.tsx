import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import FootCell from './cell';
import * as I from 'Interface';
import * as M from 'Model';

const noop = () => {};

const meta: Meta<typeof FootCell> = {
	title: 'Block/Dataview/View/Grid/Foot/Cell',
	component: FootCell,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'root',
		block: new M.Block({ id: 'foot-cell-block', type: I.BlockType.Dataview, childrenIds: [], content: {} }),
		readonly: false,
		getView: () => new M.View({ id: 'view-1', type: I.ViewType.Grid } as I.View),
		loadData: noop,
	},
};
