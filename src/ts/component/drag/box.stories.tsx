import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DragBox from './box';

const meta: Meta<typeof DragBox> = {
	title: 'Drag/Box',
	component: DragBox,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		onDragEnd: (_oldIndex: number, _newIndex: number) => {},
		children: [
			<div key="1" style={{ padding: 8, background: '#eee', marginBottom: 4 }}>Item 1</div>,
			<div key="2" style={{ padding: 8, background: '#eee', marginBottom: 4 }}>Item 2</div>,
			<div key="3" style={{ padding: 8, background: '#eee', marginBottom: 4 }}>Item 3</div>,
		],
	},
};
