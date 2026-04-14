import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../../.storybook/decorators';
import PopupInviteQr from './qr';

const meta: Meta<typeof PopupInviteQr> = {
	title: 'Popup/Invite/Qr',
	component: PopupInviteQr,
	tags: ['autodocs'],
	decorators: [
		withPopup('InviteQr'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('inviteQr-default'),
	},
};
