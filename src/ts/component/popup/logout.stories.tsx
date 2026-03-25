import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { S } from 'Lib';
import PopupLogout from './logout';

const noop = () => {};

const meta: Meta<typeof PopupLogout> = {
	title: 'Popup/Logout',
	component: PopupLogout,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 400, padding: 24 }}>
				<Story />
			</div>
		),
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
		id: 'logout-default',
		param: { data: {} },
		close: noop,
	},
};
