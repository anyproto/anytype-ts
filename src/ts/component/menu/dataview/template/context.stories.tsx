import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../../.storybook/decorators';
import MenuDataviewTemplateContext from './context';

const meta: Meta<typeof MenuDataviewTemplateContext> = {
	title: 'Menu/Dataview/Template/Context',
	component: MenuDataviewTemplateContext,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuDataviewTemplateContext') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuDataviewTemplateContext',
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
