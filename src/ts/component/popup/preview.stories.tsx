import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupPreview from './preview';

const meta: Meta<typeof PopupPreview> = {
	title: 'Popup/Preview',
	component: PopupPreview,
	tags: ['autodocs'],
	decorators: [
		withPopup('Preview'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('preview-default'),
	},
};
