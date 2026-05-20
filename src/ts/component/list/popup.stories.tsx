import type { Meta, StoryObj } from '@storybook/react';
import ListPopup from './popup';

const meta: Meta<typeof ListPopup> = {
	title: 'List/Popup',
	component: ListPopup,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
