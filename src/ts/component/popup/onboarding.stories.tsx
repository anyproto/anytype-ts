import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupOnboarding from './onboarding';

const meta: Meta<typeof PopupOnboarding> = {
	title: 'Popup/Onboarding',
	component: PopupOnboarding,
	tags: ['autodocs'],
	decorators: [
		withPopup('Onboarding'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('onboarding-default'),
	},
};
