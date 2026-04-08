import type { Meta, StoryObj } from '@storybook/react';
import IconEmoji from './iconEmoji';

const meta: Meta<typeof IconEmoji> = {
	title: 'Util/IconEmoji',
	component: IconEmoji,
	tags: ['autodocs'],
	argTypes: {
		size: {
			control: { type: 'select' },
			options: [14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96],
		},
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		icon: ':rocket:',
		size: 24,
	},
};

export const SmileEmoji: Story = {
	args: {
		icon: ':smile:',
		size: 24,
	},
};

export const LargeSize: Story = {
	args: {
		icon: ':star:',
		size: 64,
	},
};

export const SmallSize: Story = {
	args: {
		icon: ':heart:',
		size: 14,
	},
};

export const Editable: Story = {
	args: {
		icon: ':pencil:',
		size: 24,
		canEdit: true,
	},
};
