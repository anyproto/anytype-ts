import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupObjectManager from './objectManager';

const meta: Meta<typeof PopupObjectManager> = {
	title: 'Popup/ObjectManager',
	component: PopupObjectManager,
	tags: ['autodocs'],
	decorators: [
		withPopup('ObjectManager'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('objectManager-default'),
	},
};
