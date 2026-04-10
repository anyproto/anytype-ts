import type { Meta, StoryObj } from '@storybook/react';
import { withPopup } from '../../../../../../.storybook/decorators';
import StatusMessage from './statusMessage';

const meta: Meta<typeof StatusMessage> = {
	title: 'Popup/Page/AiOnboarding/StatusMessage',
	component: StatusMessage,
	tags: ['autodocs'],
	decorators: [
		withPopup('StatusMessage'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Active: Story = {
	args: {
		text: 'Processing...',
		isActive: true,
	},
};

export const Inactive: Story = {
	args: {
		text: 'Done',
		isActive: false,
	},
};
