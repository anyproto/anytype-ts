import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupPin from './pin';

const meta: Meta<typeof PopupPin> = {
	title: 'Popup/Pin',
	component: PopupPin,
	tags: ['autodocs'],
	decorators: [
		withPopup('Pin'),
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
		...popupProps('pin-default', {
			onSuccess: () => {},
			onError: () => {},
		}),
	},
};
