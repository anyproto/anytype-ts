import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuWidgetSection from './section';

const meta: Meta<typeof MenuWidgetSection> = {
	title: 'Menu/Widget/Section',
	component: MenuWidgetSection,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuWidgetSection') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuWidgetSection',
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
