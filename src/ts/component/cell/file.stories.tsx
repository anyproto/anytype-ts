import type { Meta, StoryObj } from '@storybook/react';
import CellFile from './file';

const meta: Meta<typeof CellFile> = {
	title: 'Cell/File',
	component: CellFile,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
