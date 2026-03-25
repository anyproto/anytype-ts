import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { S } from 'Lib';
import PopupPin from './pin';

const noop = () => {};

const meta: Meta<typeof PopupPin> = {
	title: 'Popup/Pin',
	component: PopupPin,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 320, padding: 24 }}>
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
	args: {
		id: 'pin-default',
		param: {
			data: {
				onSuccess: noop,
				onError: noop,
			},
		},
		close: noop,
	},
};
