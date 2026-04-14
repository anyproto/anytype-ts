import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import MediaMermaid from './mermaid';

const meta: Meta<typeof MediaMermaid> = {
	title: 'Util/Media/Mermaid',
	component: MediaMermaid,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 600, minHeight: 200 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const FlowChart: Story = {
	args: {
		id: 'mermaid-flow',
		chart: 'graph TD; A-->B; B-->C;',
	},
};

export const SequenceDiagram: Story = {
	args: {
		id: 'mermaid-seq',
		chart: 'sequenceDiagram; Alice->>Bob: Hi',
	},
};

export const PieChart: Story = {
	args: {
		id: 'mermaid-pie',
		chart: 'pie title Pets; "Dogs": 40; "Cats": 30; "Birds": 20;',
	},
};
