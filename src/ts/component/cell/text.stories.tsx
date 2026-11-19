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

// An empty name falls back to "Untitled" and renders in the placeholder color.
export const EmptyName: Story = {
	args: {
		relation: { relationKey: 'name', format: I.RelationType.ShortText },
		recordId: 'record-2',
		getRecord: () => ({ name: '' }),
		placeholder: 'Enter text...',
		viewType: I.ViewType.Grid,
	},
};

// A name literally typed as "Untitled" is a real value and keeps the normal color.
export const LiteralUntitledName: Story = {
	args: {
		relation: { relationKey: 'name', format: I.RelationType.ShortText },
		recordId: 'record-3',
		getRecord: () => ({ name: 'Untitled' }),
		placeholder: 'Enter text...',
		viewType: I.ViewType.Grid,
	},
};
