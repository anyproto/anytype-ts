import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../../.storybook/decorators';
import PopupSettingsOnboarding from './onboarding';

const meta: Meta<typeof PopupSettingsOnboarding> = {
	title: 'Popup/Settings/Onboarding',
	component: PopupSettingsOnboarding,
	tags: ['autodocs'],
	decorators: [
		withPopup('SettingsOnboarding'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('settingsOnboarding-default'),
	},
};
