import type { Meta, StoryObj } from '@storybook/react';
import EditorPage from './page';

const meta: Meta<typeof EditorPage> = {
	title: 'Editor/Page',
	component: EditorPage,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
