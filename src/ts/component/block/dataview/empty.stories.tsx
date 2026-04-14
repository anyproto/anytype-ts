import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../../.storybook/decorators';
import BlockDataviewEmpty from './empty';
import * as I from 'Interface';
import * as M from 'Model';

const meta: Meta<typeof BlockDataviewEmpty> = {
	title: 'Block/Dataview/Empty',
	component: BlockDataviewEmpty,
	tags: ['autodocs'],
	decorators: [ withBlock('blockDataview') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

const mockBlock = new M.Block({ id: 'dv-empty', childrenIds: [] } as I.Block);

export const Default: Story = {
	args: {
		block: mockBlock,
		title: 'No objects yet',
		description: 'Create your first object',
		button: 'Create',
		withButton: true,
		onClick: () => {},
	},
};

export const WithoutButton: Story = {
	args: {
		block: mockBlock,
		title: 'Empty',
		description: 'Nothing here',
		withButton: false,
		onClick: () => {},
	},
};
