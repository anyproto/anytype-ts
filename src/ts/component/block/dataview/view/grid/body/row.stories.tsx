import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import BodyRow from './row';
import * as I from 'Interface';
import * as M from 'Model';

const noop = () => {};

const meta: Meta<typeof BodyRow> = {
	title: 'Block/Dataview/View/Grid/Body/Row',
	component: BodyRow,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'root',
		block: new M.Block({ id: 'row-block', type: I.BlockType.Dataview, childrenIds: [], content: {} }),
		readonly: false,
		isInline: false,
		getView: () => new M.View({ id: 'view-1', type: I.ViewType.Grid } as I.View),
		getTarget: () => ({}),
		getVisibleRelations: () => [],
		loadData: noop,
		onContext: noop,
	},
};
