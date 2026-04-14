import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../../../.storybook/decorators';
import PopupUsecasePageItem from './item';

const meta: Meta<typeof PopupUsecasePageItem> = {
	title: 'Popup/Page/Usecase/Item',
	component: PopupUsecasePageItem,
	tags: ['autodocs'],
	decorators: [
		withPopup('UsecaseItem'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('usecaseItem-default'),
		getAuthor: () => ({}),
		onAuthor: () => {},
		onPage: () => {},
	},
};
