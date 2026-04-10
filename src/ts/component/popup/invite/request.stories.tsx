import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../../.storybook/decorators';
import PopupInviteRequest from './request';

const meta: Meta<typeof PopupInviteRequest> = {
	title: 'Popup/Invite/Request',
	component: PopupInviteRequest,
	tags: ['autodocs'],
	decorators: [
		withPopup('InviteRequest'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('inviteRequest-default'),
	},
};
