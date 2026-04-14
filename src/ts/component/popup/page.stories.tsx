import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupPage from './page';

const meta: Meta<typeof PopupPage> = {
	title: 'Popup/Page',
	component: PopupPage,
	tags: ['autodocs'],
	decorators: [
		withPopup('Page'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('page-default'),
	},
};
