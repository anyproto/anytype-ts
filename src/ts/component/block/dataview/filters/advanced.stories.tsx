import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DataviewFilterAdvanced from './advanced';
import * as I from 'Interface';

const meta: Meta<typeof DataviewFilterAdvanced> = {
	title: 'Block/Dataview/Filters/Advanced',
	component: DataviewFilterAdvanced,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		subId: 'sub-1',
		filter: {
			id: 'filter-1',
			relationKey: 'name',
			operator: I.FilterOperator.And,
			condition: I.FilterCondition.Equal,
			quickOption: I.FilterQuickOption.ExactDate,
			value: '',
			format: I.RelationType.ShortText,
			includeTime: false,
			nestedFilters: [],
		},
		readonly: false,
	},
};

export const Readonly: Story = {
	args: {
		...Default.args,
		readonly: true,
	},
};
