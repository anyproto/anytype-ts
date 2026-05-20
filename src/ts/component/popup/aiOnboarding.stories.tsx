import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupAIOnboarding from './aiOnboarding';

const meta: Meta<typeof PopupAIOnboarding> = {
	title: 'Popup/AiOnboarding',
	component: PopupAIOnboarding,
	tags: ['autodocs'],
	decorators: [
		withPopup('AiOnboarding'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('aiOnboarding-default'),
	},
};
