import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupSearch from './search';

const meta: Meta<typeof PopupSearch> = {
	title: 'Popup/Search',
	component: PopupSearch,
	tags: ['autodocs'],
	decorators: [
		withPopup('Search'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('search-default'),
	},
};
