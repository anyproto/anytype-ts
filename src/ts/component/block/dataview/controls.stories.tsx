import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Controls from './controls';
import * as I from 'Interface';
import * as M from 'Model';

const noop = () => {};

const meta: Meta<typeof Controls> = {
	title: 'Block/Dataview/Controls',
	component: Controls,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'root',
		block: new M.Block({ id: 'controls-block', type: I.BlockType.Dataview, childrenIds: [], content: {} }),
		readonly: false,
		isInline: false,
		isCollection: false,
		getView: () => new M.View({ id: 'view-1', type: I.ViewType.Grid } as I.View),
		getTarget: () => ({}),
		getTypeId: () => '',
		getSources: () => [],
		getVisibleRelations: () => [],
		getTemplateId: () => '',
		isAllowedDefaultType: () => true,
		loadData: noop,
		onRecordAdd: noop,
		onTemplateMenu: noop,
		onTemplateAdd: noop,
		onSortAdd: noop,
		onFilterAdd: noop,
		onFilterAddClick: noop,
		toggleFilters: noop,
		closeFilters: noop,
		onFilterChange: noop,
	},
};
