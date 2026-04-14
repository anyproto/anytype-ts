import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DataviewFilterItem from './item';
import * as I from 'Interface';

const meta: Meta<typeof DataviewFilterItem> = {
	title: 'Block/Dataview/Filters/Item',
	component: DataviewFilterItem,
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
			relationName: 'Name',
			relationFormat: I.RelationType.ShortText,
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
