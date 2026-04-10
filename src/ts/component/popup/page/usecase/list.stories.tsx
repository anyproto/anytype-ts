import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../../../.storybook/decorators';
import PopupUsecasePageList from './list';

const meta: Meta<typeof PopupUsecasePageList> = {
	title: 'Popup/Page/Usecase/List',
	component: PopupUsecasePageList,
	tags: ['autodocs'],
	decorators: [
		withPopup('UsecaseList'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('usecaseList-default'),
		onPage: () => {},
	},
};
