import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import MediaVideo from './video';

const meta: Meta<typeof MediaVideo> = {
	title: 'Util/Media/Video',
	component: MediaVideo,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 480, height: 270 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		src: 'https://example.com/video.mp4',
	},
};

export const AutoPlay: Story = {
	args: {
		src: 'https://example.com/video.mp4',
		canPlay: true,
	},
};

export const Disabled: Story = {
	args: {
		src: 'https://example.com/video.mp4',
		canPlay: false,
	},
};
