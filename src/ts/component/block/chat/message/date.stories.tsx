import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../../../.storybook/decorators';
import SectionDate from './date';

const meta: Meta<typeof SectionDate> = {
	title: 'Block/Chat/Message/Date',
	component: SectionDate,
	tags: ['autodocs'],
	decorators: [ withBlock('blockChat') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Today: Story = {
	args: {
		date: Math.floor(Date.now() / 1000),
	},
};

export const Yesterday: Story = {
	args: {
		date: Math.floor(Date.now() / 1000) - 86400,
	},
};

export const OlderDate: Story = {
	args: {
		date: Math.floor(new Date('2024-01-15').getTime() / 1000),
	},
};
