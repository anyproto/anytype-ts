import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import MediaAudio from './audio';

const meta: Meta<typeof MediaAudio> = {
	title: 'Util/Media/Audio',
	component: MediaAudio,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 480 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const SingleTrack: Story = {
	args: {
		playlist: [
			{ name: 'Track One', src: 'https://example.com/audio1.mp3' },
		],
	},
};

export const MultipleTracks: Story = {
	args: {
		playlist: [
			{ name: 'Track One', src: 'https://example.com/audio1.mp3' },
			{ name: 'Track Two', src: 'https://example.com/audio2.mp3' },
			{ name: 'Track Three', src: 'https://example.com/audio3.mp3' },
		],
	},
};

export const EmptyPlaylist: Story = {
	args: {
		playlist: [],
	},
};
