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
		asImage: {
			control: 'boolean',
		},
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		icon: ':rocket:',
		size: 24,
		asImage: true,
	},
};

export const SmileEmoji: Story = {
	args: {
		icon: ':smile:',
		size: 24,
		asImage: true,
	},
};

export const LargeSize: Story = {
	args: {
		icon: ':star:',
		size: 64,
		asImage: true,
	},
};

export const SmallSize: Story = {
	args: {
		icon: ':heart:',
		size: 14,
		asImage: true,
	},
};

export const AsHtmlElement: Story = {
	args: {
		icon: ':wave:',
		size: 24,
		asImage: false,
	},
};

export const Editable: Story = {
	args: {
		icon: ':pencil:',
		size: 24,
		asImage: true,
		canEdit: true,
	},
};
