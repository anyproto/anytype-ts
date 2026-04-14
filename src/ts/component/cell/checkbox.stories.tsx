import type { Meta, StoryObj } from '@storybook/react';
import * as I from 'Interface';
import CellCheckbox from './checkbox';

const meta: Meta<typeof CellCheckbox> = {
	title: 'Cell/Checkbox',
	component: CellCheckbox,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Checked: Story = {
	args: {
		relation: { relationKey: 'done', format: I.RelationType.Checkbox },
		recordId: 'record-1',
		getRecord: () => ({ done: true }),
		onChange: () => {},
		viewType: I.ViewType.Grid,
	},
};

export const Unchecked: Story = {
	args: {
		relation: { relationKey: 'done', format: I.RelationType.Checkbox },
		recordId: 'record-2',
		getRecord: () => ({ done: false }),
		onChange: () => {},
		viewType: I.ViewType.Grid,
	},
};
