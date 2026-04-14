import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import BlockDataviewHead from './head';
import * as I from 'Interface';
import * as M from 'Model';

const noop = () => {};

const meta: Meta<typeof BlockDataviewHead> = {
	title: 'Block/Dataview/Head',
	component: BlockDataviewHead,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'root',
		block: new M.Block({ id: 'head-block', type: I.BlockType.Dataview, childrenIds: [], content: {} }),
		readonly: false,
		isCollection: false,
		getTarget: () => ({ name: 'Test Dataview', layout: I.ObjectLayout.Set }),
		getView: () => new M.View({ id: 'view-1', type: I.ViewType.Grid } as I.View),
		loadData: noop,
		onSourceSelect: noop,
		onSourceTypeSelect: noop,
	},
};
