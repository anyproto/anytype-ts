import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../../.storybook/decorators';
import MenuPreviewLatex from './latex';

const meta: Meta<typeof MenuPreviewLatex> = {
	title: 'Menu/Preview/Latex',
	component: MenuPreviewLatex,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuPreviewLatex') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {
				text: 'E = mc^2',
			},
		},
		getId: () => 'menuPreviewLatex',
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
