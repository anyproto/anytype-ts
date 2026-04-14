import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupIntroduceChats from './introduceChats';

const meta: Meta<typeof PopupIntroduceChats> = {
	title: 'Popup/IntroduceChats',
	component: PopupIntroduceChats,
	tags: ['autodocs'],
	decorators: [
		withPopup('IntroduceChats'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('introduceChats-default'),
	},
};
