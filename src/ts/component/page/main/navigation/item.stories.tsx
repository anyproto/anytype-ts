import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import NavigationItem from './item';
import { I } from 'Lib';

const meta: Meta<typeof NavigationItem> = {
	title: 'Page/Main/Navigation/Item',
	component: NavigationItem,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		item: {
			id: 'sb-item',
			layout: I.ObjectLayout.Page,
			name: 'Sample Page',
		},
		onClick: () => {},
		onContext: () => {},
	},
};
