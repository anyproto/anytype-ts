import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../../.storybook/decorators';
import PopupMembershipFinalization from './finalization';

const meta: Meta<typeof PopupMembershipFinalization> = {
	title: 'Popup/Membership/Finalization',
	component: PopupMembershipFinalization,
	tags: ['autodocs'],
	decorators: [
		withPopup('MembershipFinalization'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('membershipFinalization-default'),
	},
};
