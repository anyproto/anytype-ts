import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ViewGrid from './grid';
import * as I from 'Interface';
import * as M from 'Model';

const noop = () => {};

const meta: Meta<typeof ViewGrid> = {
	title: 'Block/Dataview/View/Grid',
	component: ViewGrid,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'root',
		block: new M.Block({ id: 'grid-block', type: I.BlockType.Dataview, childrenIds: [], content: {} }),
		readonly: false,
		isInline: false,
		isCollection: false,
		getView: () => new M.View({ id: 'view-1', type: I.ViewType.Grid } as I.View),
		getTarget: () => ({}),
		getVisibleRelations: () => [],
		getSources: () => [],
		loadData: noop,
		onRecordAdd: noop,
		onContext: noop,
		onCellClick: noop,
	},
};
