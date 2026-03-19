import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Dimmer from './dimmer';

const meta: Meta<typeof Dimmer> = {
	title: 'Util/Dimmer',
	component: Dimmer,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ position: 'relative', width: 300, height: 200, background: '#fff' }}>
				<div style={{ padding: 20 }}>Content behind dimmer</div>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};

export const WithClassName: Story = {
	args: {
		className: 'customDimmer',
	},
};
