import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupUpload from './upload';

const meta: Meta<typeof PopupUpload> = {
	title: 'Popup/Upload',
	component: PopupUpload,
	tags: ['autodocs'],
	decorators: [
		withPopup('Upload'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('upload-default', {
			layout: 0,
			onUpload: () => {},
			route: 'storybook',
		}),
	},
};
