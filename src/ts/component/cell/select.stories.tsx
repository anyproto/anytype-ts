import type { Meta, StoryObj } from '@storybook/react';
import CellSelect from './select';

const meta: Meta<typeof CellSelect> = {
	title: 'Cell/Select',
	component: CellSelect,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
