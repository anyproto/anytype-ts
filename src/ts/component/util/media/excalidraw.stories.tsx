import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import MediaExcalidraw from './excalidraw';

const meta: Meta<typeof MediaExcalidraw> = {
	title: 'Util/Media/Excalidraw',
	component: MediaExcalidraw,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 800, height: 500 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		data: {
			elements: [],
			appState: {},
		},
		readonly: false,
		onChange: () => {},
	},
};

export const Readonly: Story = {
	args: {
		data: {
			elements: [],
			appState: {},
		},
		readonly: true,
		onChange: () => {},
	},
};

export const WithElements: Story = {
	args: {
		data: {
			elements: [
				{
					type: 'rectangle',
					x: 100,
					y: 100,
					width: 200,
					height: 100,
					strokeColor: '#000000',
					backgroundColor: '#a5d8ff',
					fillStyle: 'solid',
					id: 'rect-1',
					version: 1,
					versionNonce: 1,
					isDeleted: false,
				},
			],
			appState: {},
		},
		readonly: false,
		onChange: () => {},
	},
};
