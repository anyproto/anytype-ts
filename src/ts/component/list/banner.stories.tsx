import type { Meta, StoryObj } from '@storybook/react';
import ListBanner from './banner';

const meta: Meta<typeof ListBanner> = {
	title: 'List/Banner',
	component: ListBanner,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
