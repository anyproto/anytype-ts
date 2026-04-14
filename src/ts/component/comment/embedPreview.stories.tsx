import type { Meta, StoryObj } from '@storybook/react';
import * as I from 'Interface';
import EmbedPreview from './embedPreview';

const meta: Meta<typeof EmbedPreview> = {
	title: 'Comment/EmbedPreview',
	component: EmbedPreview,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Latex: Story = {
	args: {
		processor: I.EmbedProcessor.Latex,
		text: 'E = mc^2',
	},
};

export const Default: Story = {
	args: {
		processor: I.EmbedProcessor.Youtube,
		text: 'https://youtube.com/watch?v=test',
	},
};
