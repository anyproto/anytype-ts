import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import BoardCard from './card';
import * as I from 'Interface';
import * as M from 'Model';

const noop = () => {};

const meta: Meta<typeof BoardCard> = {
	title: 'Block/Dataview/View/Board/Card',
	component: BoardCard,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'root',
		block: new M.Block({ id: 'board-card-block', type: I.BlockType.Dataview, childrenIds: [], content: {} }),
		groupId: 'group-1',
		id: 'record-1',
		readonly: false,
		getView: () => new M.View({ id: 'view-1', type: I.ViewType.Board } as I.View),
		getVisibleRelations: () => [],
		onContext: noop,
		loadData: noop,
	},
};
