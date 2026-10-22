import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import 'Component';
import PageAuthPinCheck from './pinCheck';

const meta: Meta<typeof PageAuthPinCheck> = {
	title: 'Page/Auth/PinCheck',
	component: PageAuthPinCheck,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div className="pageAuth pageAuthPinCheck" style={{ width: 480, minHeight: 400, margin: '0 auto' }}>
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
			S.Common.pinValue = '1234';
			return <Story />;
		},
	],
};

export const TouchId: Story = {
	...Default,
	beforeEach: () => {
		const electron = U.Common.getElectron();
		const api = electron.Api;

		electron.Api = (id, cmd, args) => (cmd == 'getTouchIdState') ?
			Promise.resolve({ available: true, enabled: true }) : api(id, cmd, args);

		return () => { electron.Api = api; };
	},
};
