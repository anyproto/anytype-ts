import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withMenuClass } from '../../../../.storybook/decorators';
import MenuSelect from './select';

const meta: Meta<typeof MenuSelect> = {
	title: 'Menu/Select',
	component: MenuSelect,
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuSelect') ],
};
export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		param: {
			data: {
				value: '',
				options: [
					{ id: '1', name: 'Option 1' },
					{ id: '2', name: 'Option 2' },
				],
			},
		},
		getId: () => 'menuSelect',
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
