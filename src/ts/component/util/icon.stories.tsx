import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Icon from './icon';

import './icons/common';
import './icons/type';

const COLOR_OPTIONS = [
	'default', 'grey', 'yellow', 'orange', 'red', 'pink', 'purple',
	'blue', 'ice', 'teal', 'lime', 'darkGrey', 'darkOrange', 'darkRed',
	'accent125', 'accent100', 'accent50', 'accent25',
];

const meta: Meta<typeof Icon> = {
	title: 'Util/Icon',
	component: Icon,
	tags: ['autodocs'],
	argTypes: {
		color: {
			control: 'select',
			options: COLOR_OPTIONS,
			description: 'Icon color variant (maps to iconColor-{color} CSS class)',
		},
		name: {
			control: 'text',
			description: 'Icon name from the icon registry',
		},
		size: {
			control: { type: 'number', min: 12, max: 64, step: 2 },
		},
		withBackground: {
			control: 'boolean',
		},
	},
	decorators: [
		(Story) => (
			<div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 20 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: 'common/close',
		size: 20,
	},
};

export const WithArrow: Story = {
	args: {
		name: 'common/expand',
		arrow: true,
	},
};

export const Draggable: Story = {
	args: {
		name: 'control/cover/drag',
		draggable: true,
	},
};

export const WithInner: Story = {
	args: {
		name: 'plus/menu',
		inner: <span style={{ fontSize: 12 }}>+</span>,
	},
};

export const WithBackground: Story = {
	args: {
		name: 'common/more',
		withBackground: true,
	},
};

export const AllColors = {
	render: () => (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
			<h3 style={{ margin: 0, fontWeight: 600 }}>Icon Colors</h3>
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
				{COLOR_OPTIONS.map(color => (
					<div key={color} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
						<Icon name="type/document-text" color={color} size={24} />
						<span style={{ fontSize: 10, color: '#888' }}>{color}</span>
					</div>
				))}
			</div>
		</div>
	),
};
