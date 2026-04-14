import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupRelation from './relation';

const meta: Meta<typeof PopupRelation> = {
	title: 'Popup/Relation',
	component: PopupRelation,
	tags: ['autodocs'],
	decorators: [
		withPopup('Relation'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('relation-default'),
	},
};
