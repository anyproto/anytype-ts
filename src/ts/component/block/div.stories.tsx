import type { Meta, StoryObj } from '@storybook/react';
import { I } from 'Lib';
import { withBlock } from '../../../../.storybook/decorators';
import BlockDiv from './div';

const meta: Meta<typeof BlockDiv> = {
	title: 'Block/Div',
	component: BlockDiv,
	tags: ['autodocs'],
	decorators: [
		withBlock('blockDiv'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Line: Story = {
	args: {
		block: {
			id: 'div-line',
			type: I.BlockType.Div,
			content: { style: I.DivStyle.Line },
			childrenIds: [],
		},
	},
};

export const Dots: Story = {
	args: {
		block: {
			id: 'div-dots',
			type: I.BlockType.Div,
			content: { style: I.DivStyle.Dot },
			childrenIds: [],
		},
	},
};
