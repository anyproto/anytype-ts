import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../.storybook/decorators';
import BlockDiv from './div';
import * as I from 'Interface';
import * as M from 'Model';

const makeBlock = (id: string, style: number) => new M.Block({
	id,
	type: I.BlockType.Div,
	content: { style },
	childrenIds: [],
});

const meta: Meta<typeof BlockDiv> = {
	title: 'Block/Div',
	component: BlockDiv,
	tags: ['autodocs'],
	decorators: [
		withBlock(U.Data.blockClass(makeBlock('_', I.DivStyle.Line))),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Line: Story = {
	args: {
		block: makeBlock('div-line', I.DivStyle.Line),
	},
};

export const Dots: Story = {
	args: {
		block: makeBlock('div-dots', I.DivStyle.Dot),
	},
};
