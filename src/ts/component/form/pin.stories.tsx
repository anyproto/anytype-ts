import type { Meta, StoryObj } from '@storybook/react';
import Pin from './pin';

const meta: Meta<typeof Pin> = {
	title: 'Form/Pin',
	component: Pin,
	tags: ['autodocs'],
	argTypes: {
		pinLength: { control: { type: 'number', min: 3, max: 8 } },
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		pinLength: 6,
		focusOnMount: false,
	},
};

export const FourDigit: Story = {
	args: {
		pinLength: 4,
		focusOnMount: false,
	},
};

export const NumericOnly: Story = {
	args: {
		pinLength: 6,
		isNumeric: true,
		focusOnMount: false,
	},
};

export const Visible: Story = {
	args: {
		pinLength: 6,
		isVisible: true,
		focusOnMount: false,
	},
};

export const ReadOnly: Story = {
	args: {
		pinLength: 6,
		readonly: true,
		focusOnMount: false,
	},
};
