import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupPhrase from './phrase';

const meta: Meta<typeof PopupPhrase> = {
	title: 'Popup/Phrase',
	component: PopupPhrase,
	tags: ['autodocs'],
	decorators: [
		withPopup('Phrase'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('phrase-default'),
	},
};
