import type { Meta, StoryObj } from '@storybook/react';
import ShareTooltip from './tooltip';

const meta: Meta<typeof ShareTooltip> = {
	title: 'Util/Share/Tooltip',
	component: ShareTooltip,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		text: 'Share this object with others',
	},
};

export const ShortText: Story = {
	args: {
		text: 'Share',
	},
};

export const LongText: Story = {
	args: {
		text: 'Click here to share this object with your team members and collaborators',
	},
};
