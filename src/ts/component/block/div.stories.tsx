import type { Meta, StoryObj } from '@storybook/react';
import { I } from 'Lib';
import BlockDiv from './div';

const meta: Meta<typeof BlockDiv> = {
	title: 'Block/Div',
	component: BlockDiv,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 600, padding: 16 }}>
				<Story />
			</div>
		),
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
