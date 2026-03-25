import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupHelp from './help';

const meta: Meta<typeof PopupHelp> = {
	title: 'Popup/Help',
	component: PopupHelp,
	tags: ['autodocs'],
	decorators: [
		withPopup('Help'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const WhatsNew: Story = {
	args: {
		...popupProps('help-whatsnew', { document: 'whatsNew' }),
	},
};
