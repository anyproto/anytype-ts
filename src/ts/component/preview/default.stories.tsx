import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PreviewDefault from './default';

const meta: Meta<typeof PreviewDefault> = {
	title: 'Preview/Default',
	component: PreviewDefault,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 300 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		noLoad: true,
		object: {
			id: 'obj-1',
			name: 'Getting Started Guide',
			description: 'A comprehensive guide to help you get started with the application.',
			layout: 0,
			type: '',
		},
	},
};

export const WithLongDescription: Story = {
	args: {
		noLoad: true,
		object: {
			id: 'obj-2',
			name: 'Architecture Decision Record',
			description: 'This document outlines the key architectural decisions made during the project planning phase, including technology stack choices and infrastructure requirements.',
			layout: 0,
			type: '',
		},
	},
};

export const NoteLayout: Story = {
	args: {
		noLoad: true,
		object: {
			id: 'obj-3',
			name: '',
			snippet: 'Quick note about the meeting tomorrow...',
			description: '',
			layout: 9,
			type: '',
		},
	},
};

export const EmptyObject: Story = {
	args: {
		noLoad: true,
		object: {
			id: 'obj-4',
			name: '',
			description: '',
			layout: 0,
			type: '',
		},
	},
};

export const WithPlural: Story = {
	args: {
		noLoad: true,
		withPlural: true,
		object: {
			id: 'obj-5',
			name: 'Task',
			pluralName: 'Tasks',
			description: 'Track your work items',
			layout: 0,
			type: '',
		},
	},
};
