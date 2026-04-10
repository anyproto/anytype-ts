import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupUsecase from './usecase';

const meta: Meta<typeof PopupUsecase> = {
	title: 'Popup/Usecase',
	component: PopupUsecase,
	tags: ['autodocs'],
	decorators: [
		withPopup('Usecase'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('usecase-default'),
	},
};
