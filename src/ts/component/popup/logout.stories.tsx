import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupLogout from './logout';

const meta: Meta<typeof PopupLogout> = {
	title: 'Popup/Logout',
	component: PopupLogout,
	tags: ['autodocs'],
	decorators: [
		withPopup('Logout'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	decorators: [
		(Story) => {
			S.Auth.accountItem = { id: 'account-1', info: {} } as any;
			return <Story />;
		},
	],
	args: {
		...popupProps('logout-default'),
	},
};
