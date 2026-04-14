import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../.storybook/decorators';
import BlockTable from './table';
import * as I from 'Interface';
import * as M from 'Model';

const ROOT = 'sb-table';

const makeBlock = (id: string) => new M.Block({
	id,
	type: I.BlockType.Table,
	childrenIds: [],
	content: {},
});

const meta: Meta<typeof BlockTable> = {
	title: 'Block/Table',
	component: BlockTable,
	tags: ['autodocs'],
	decorators: [ withBlock('blockTable') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('table-default'),
		getWrapperWidth: () => 700,
	},
};
