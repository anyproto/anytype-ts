import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../.storybook/decorators';
import MenuTableOfContents from './tableOfContents';

const meta: Meta<typeof MenuTableOfContents> = {
	title: 'Menu/TableOfContents',
	component: MenuTableOfContents,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuTableOfContents') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {},
		},
		getId: () => 'menuTableOfContents',
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
