import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageMainRelation from './relation';

const meta: Meta<typeof PageMainRelation> = {
	title: 'Page/Main/Relation',
	component: PageMainRelation,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		isPopup: false,
	},
};
