import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DataviewFilterGroup from './group';
import * as I from 'Interface';
import * as M from 'Model';

const noop = () => {};

const meta: Meta<typeof DataviewFilterGroup> = {
	title: 'Block/Dataview/Filters/Group',
	component: DataviewFilterGroup,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'root',
		blockId: 'block-1',
		filter: {
			id: 'group-1',
			relationKey: '',
			operator: I.FilterOperator.And,
			condition: I.FilterCondition.Equal,
			quickOption: I.FilterQuickOption.ExactDate,
			value: '',
			format: I.RelationType.ShortText,
			includeTime: false,
			nestedFilters: [],
		},
		depth: 0,
		getView: () => new M.View({ id: 'view-1', type: I.ViewType.Grid } as I.View),
		getTarget: () => ({}),
		isInline: false,
		loadData: noop,
		readonly: false,
	},
};
