import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../../.storybook/decorators';
import ContentLink from './link';

const meta: Meta<typeof ContentLink> = {
	title: 'Block/Help/ContentLink',
	component: ContentLink,
	tags: ['autodocs'],
	decorators: [ withBlock('blockHelp') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		icon: 'help',
		name: 'Getting Started',
		contentId: 'intro',
	},
};

export const WithoutIcon: Story = {
	args: {
		name: 'Getting Started',
	},
};
