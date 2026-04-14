import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../../.storybook/decorators';
import PopupMembershipActivation from './activation';

const meta: Meta<typeof PopupMembershipActivation> = {
	title: 'Popup/Membership/Activation',
	component: PopupMembershipActivation,
	tags: ['autodocs'],
	decorators: [
		withPopup('MembershipActivation'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('membershipActivation-default'),
	},
};
