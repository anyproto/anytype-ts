import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupShortcut from './shortcut';

const meta: Meta<typeof PopupShortcut> = {
	title: 'Popup/Shortcut',
	component: PopupShortcut,
	tags: ['autodocs'],
	decorators: [
		withPopup('Shortcut'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('shortcut-default'),
	},
};
