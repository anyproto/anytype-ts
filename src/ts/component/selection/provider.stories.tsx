import type { Meta, StoryObj } from '@storybook/react';
import SelectionProvider from './provider';

const meta: Meta<typeof SelectionProvider> = {
	title: 'Selection/Provider',
	component: SelectionProvider,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
