import type { Meta, StoryObj } from '@storybook/react';
import * as I from 'Interface';
import CellText from './text';

const meta: Meta<typeof CellText> = {
	title: 'Cell/Text',
	component: CellText,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		relation: { relationKey: 'name', format: I.RelationType.ShortText },
		recordId: 'record-1',
		getRecord: () => ({ name: 'Test value' }),
		placeholder: 'Enter text...',
		viewType: I.ViewType.Grid,
	},
};
