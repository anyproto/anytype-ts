import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupAbout from './about';

const meta: Meta<typeof PopupAbout> = {
	title: 'Popup/About',
	component: PopupAbout,
	tags: ['autodocs'],
	decorators: [
		withPopup('About'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('about-default'),
	},
};
