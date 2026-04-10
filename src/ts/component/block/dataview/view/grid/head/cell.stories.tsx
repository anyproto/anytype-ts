import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import HeadCell from './cell';
import * as I from 'Interface';
import * as M from 'Model';

const noop = () => {};

const meta: Meta<typeof HeadCell> = {
	title: 'Block/Dataview/View/Grid/Head/Cell',
	component: HeadCell,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'root',
		block: new M.Block({ id: 'head-cell-block', type: I.BlockType.Dataview, childrenIds: [], content: {} }),
		readonly: false,
		getView: () => new M.View({ id: 'view-1', type: I.ViewType.Grid } as I.View),
		loadData: noop,
	},
};
