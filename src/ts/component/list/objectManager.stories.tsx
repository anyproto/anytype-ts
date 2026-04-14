import type { Meta, StoryObj } from '@storybook/react';
import ObjectManager from './objectManager';

const meta: Meta<typeof ObjectManager> = {
	title: 'List/ObjectManager',
	component: ObjectManager,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
