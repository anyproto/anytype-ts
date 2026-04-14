import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../.storybook/decorators';
import MenuParticipant from './participant';

const meta: Meta<typeof MenuParticipant> = {
	title: 'Menu/Participant',
	component: MenuParticipant,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuParticipant') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuParticipant',
		getSize: () => ({ width: 280, height: 400 }),
		position: () => {},
		close: () => {},
		setActive: () => {},
		onKeyDown: () => {},
		storageGet: () => ({}),
		storageSet: () => {},
		getItems: () => [],
	},
};
