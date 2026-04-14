import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ViewGraph from './graph';
import * as I from 'Interface';
import * as M from 'Model';

const noop = () => {};

const meta: Meta<typeof ViewGraph> = {
	title: 'Block/Dataview/View/Graph',
	component: ViewGraph,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'root',
		block: new M.Block({ id: 'graph-block', type: I.BlockType.Dataview, childrenIds: [], content: {} }),
		readonly: false,
		isInline: false,
		getView: () => new M.View({ id: 'view-1', type: I.ViewType.Graph } as I.View),
		getTarget: () => ({}),
		loadData: noop,
	},
};
