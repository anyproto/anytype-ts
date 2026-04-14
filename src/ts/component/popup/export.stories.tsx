import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupExport from './export';

const meta: Meta<typeof PopupExport> = {
	title: 'Popup/Export',
	component: PopupExport,
	tags: ['autodocs'],
	decorators: [
		withPopup('Export'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('export-default'),
	},
};
