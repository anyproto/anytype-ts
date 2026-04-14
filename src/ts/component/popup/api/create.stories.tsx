import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../../.storybook/decorators';
import PopupApiCreate from './create';

const meta: Meta<typeof PopupApiCreate> = {
	title: 'Popup/Api/Create',
	component: PopupApiCreate,
	tags: ['autodocs'],
	decorators: [
		withPopup('ApiCreate'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('apiCreate-default'),
	},
};
