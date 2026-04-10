import type { Meta, StoryObj } from '@storybook/react';
import ChatCounter from './chatCounter';

const meta: Meta<typeof ChatCounter> = {
	title: 'Util/ChatCounter',
	component: ChatCounter,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		spaceId: 'mock-space',
		chatId: 'mock-chat',
	},
};

export const Minimal: Story = {
	args: {
		spaceId: 'mock-space',
		chatId: 'mock-chat',
		isMinimal: true,
	},
};

export const WithClassName: Story = {
	args: {
		spaceId: 'mock-space',
		chatId: 'mock-chat',
		className: 'customClass',
	},
};
