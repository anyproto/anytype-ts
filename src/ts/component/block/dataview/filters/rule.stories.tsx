import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DataviewFilterRule from './rule';
import * as I from 'Interface';
import * as M from 'Model';

const noop = () => {};

const meta: Meta<typeof DataviewFilterRule> = {
	title: 'Block/Dataview/Filters/Rule',
	component: DataviewFilterRule,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'root',
		blockId: 'block-1',
		rule: {
			id: 'rule-1',
			relationKey: 'name',
			operator: I.FilterOperator.And,
			condition: I.FilterCondition.Equal,
			quickOption: I.FilterQuickOption.ExactDate,
			value: '',
			format: I.RelationType.ShortText,
			includeTime: false,
			nestedFilters: [],
		},
		index: 0,
		depth: 0,
		parentPath: '',
		operator: I.FilterOperator.And,
		getView: () => new M.View({ id: 'view-1', type: I.ViewType.Grid } as I.View),
		getTarget: () => ({}),
		isInline: false,
		loadData: noop,
		readonly: false,
	},
};
