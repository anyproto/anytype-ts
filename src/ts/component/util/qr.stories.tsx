import type { Meta, StoryObj } from '@storybook/react';
import QR from './qr';

const meta: Meta<typeof QR> = {
	title: 'Util/QR',
	component: QR,
	tags: ['autodocs'],
	argTypes: {
		size: { control: { type: 'number', min: 50, max: 400 } },
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		value: 'https://anytype.io',
	},
};

export const Small: Story = {
	args: {
		value: 'https://anytype.io',
		size: 80,
	},
};

export const Large: Story = {
	args: {
		value: 'https://anytype.io',
		size: 256,
	},
};

export const LongText: Story = {
	args: {
		value: 'This is a longer text encoded into a QR code to test density handling',
		size: 200,
	},
};
