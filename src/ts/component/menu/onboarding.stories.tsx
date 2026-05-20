import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../.storybook/decorators';
import MenuOnboarding from './onboarding';

const meta: Meta<typeof MenuOnboarding> = {
	title: 'Menu/Onboarding',
	component: MenuOnboarding,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuOnboarding') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuOnboarding',
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
