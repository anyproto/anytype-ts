import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import BlockTableCell from './cell';
import * as I from 'Interface';
import * as M from 'Model';

const noop = () => {};

const meta: Meta<typeof BlockTableCell> = {
	title: 'Block/Table/Cell',
	component: BlockTableCell,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'root',
		block: new M.Block({ id: 'table-cell', type: I.BlockType.TableOfContents, childrenIds: [], content: {} }),
		readonly: false,
		getData: () => ({}),
		onEnterHandle: noop,
		onLeaveHandle: noop,
		onHandleRow: noop,
		onHandleColumn: noop,
		onOptions: noop,
		onCellClick: noop,
		onCellMouseDown: () => false,
		onCellFocus: noop,
		onCellBlur: noop,
	},
};
