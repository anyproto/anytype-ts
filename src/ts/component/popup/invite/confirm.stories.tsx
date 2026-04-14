import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../../.storybook/decorators';
import PopupInviteConfirm from './confirm';

const meta: Meta<typeof PopupInviteConfirm> = {
	title: 'Popup/Invite/Confirm',
	component: PopupInviteConfirm,
	tags: ['autodocs'],
	decorators: [
		withPopup('InviteConfirm'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('inviteConfirm-default'),
	},
};
