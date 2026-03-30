import type { Meta, StoryObj } from '@storybook/react';
import Marker from './marker';
import * as I from 'Interface';

const meta: Meta<typeof Marker> = {
	title: 'Util/Marker',
	component: Marker,
	tags: ['autodocs'],
	argTypes: {
		type: {
			control: 'select',
			options: [I.MarkerType.Bulleted, I.MarkerType.Numbered, I.MarkerType.Checkbox, I.MarkerType.Toggle],
		},
		color: {
			control: 'select',
			options: ['default', 'grey', 'yellow', 'orange', 'red', 'pink', 'purple', 'blue', 'ice', 'teal', 'lime', 'green'],
		},
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Bulleted: Story = {
	args: {
		id: 'bullet-1',
		type: I.MarkerType.Bulleted,
		color: 'default',
	},
};

export const Numbered: Story = {
	args: {
		id: 'number-1',
		type: I.MarkerType.Numbered,
		color: 'default',
	},
};

export const CheckboxUnchecked: Story = {
	args: {
		id: 'checkbox-1',
		type: I.MarkerType.Checkbox,
		color: 'default',
		active: false,
	},
};

export const CheckboxChecked: Story = {
	args: {
		id: 'checkbox-2',
		type: I.MarkerType.Checkbox,
		color: 'default',
		active: true,
	},
};

export const Toggle: Story = {
	args: {
		id: 'toggle-1',
		type: I.MarkerType.Toggle,
		color: 'default',
	},
};

export const ToggleActive: Story = {
	args: {
		id: 'toggle-2',
		type: I.MarkerType.Toggle,
		color: 'default',
		active: true,
	},
};

export const ColoredBullet: Story = {
	args: {
		id: 'colored-1',
		type: I.MarkerType.Bulleted,
		color: 'red',
	},
};
