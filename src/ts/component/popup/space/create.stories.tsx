import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../../.storybook/decorators';
import PopupSpaceCreate from './create';

const meta: Meta<typeof PopupSpaceCreate> = {
	title: 'Popup/Space/Create',
	component: PopupSpaceCreate,
	tags: ['autodocs'],
	decorators: [
		withPopup('SpaceCreate'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('spaceCreate-default'),
	},
};
