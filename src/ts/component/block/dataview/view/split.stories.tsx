import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ViewSplit from './split';
import * as I from 'Interface';
import * as M from 'Model';

const noop = () => {};

const meta: Meta<typeof ViewSplit> = {
	title: 'Block/Dataview/View/Split',
	component: ViewSplit,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'root',
		block: new M.Block({ id: 'split-block', type: I.BlockType.Dataview, childrenIds: [], content: {} }),
		readonly: false,
		isInline: false,
		isCollection: true,
		getView: () => new M.View({ id: 'view-1', type: I.ViewType.Split } as I.View),
		getTarget: () => ({}),
		getVisibleRelations: () => [],
		getSources: () => [],
		loadData: noop,
		onRecordAdd: noop,
		onContext: noop,
	},
};

export const EmptyDetail: Story = {
	args: {
		...Default.args,
		getRecords: () => [],
	},
};
