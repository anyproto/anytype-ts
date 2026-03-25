import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupShare from './share';

const meta: Meta<typeof PopupShare> = {
	title: 'Popup/Share',
	component: PopupShare,
	tags: ['autodocs'],
	decorators: [
		withPopup('Share'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('share-default'),
	},
};
