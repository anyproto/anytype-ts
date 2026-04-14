import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import BodyCell from './cell';
import * as I from 'Interface';
import * as M from 'Model';

const noop = () => {};

const meta: Meta<typeof BodyCell> = {
	title: 'Block/Dataview/View/Grid/Body/Cell',
	component: BodyCell,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'root',
		block: new M.Block({ id: 'cell-block', type: I.BlockType.Dataview, childrenIds: [], content: {} }),
		readonly: false,
		getView: () => new M.View({ id: 'view-1', type: I.ViewType.Grid } as I.View),
		loadData: noop,
	},
};
