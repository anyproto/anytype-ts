import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../../.storybook/decorators';
import BlockDataviewSelection from './selection';

const meta: Meta<typeof BlockDataviewSelection> = {
	title: 'Block/Dataview/Selection',
	component: BlockDataviewSelection,
	tags: ['autodocs'],
	decorators: [ withBlock('blockDataview') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		className: '',
		isInline: false,
		isCollection: false,
		readonly: false,
		multiSelectAction: (id: string) => console.log('action', id),
		loadData: () => {},
	},
};

export const Collection: Story = {
	args: {
		className: '',
		isInline: false,
		isCollection: true,
		readonly: false,
		multiSelectAction: (id: string) => console.log('action', id),
		loadData: () => {},
	},
};
