import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../../.storybook/decorators';
import ContentText from './text';
import * as I from 'Interface';

const meta: Meta<typeof ContentText> = {
	title: 'Block/Help/ContentText',
	component: ContentText,
	tags: ['autodocs'],
	decorators: [ withBlock('blockHelp') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Paragraph: Story = {
	args: {
		style: I.TextStyle.Paragraph,
		text: 'Hello world',
	},
};

export const Heading: Story = {
	args: {
		style: I.TextStyle.Header1,
		text: 'Title',
	},
};

export const Checkbox: Story = {
	args: {
		style: I.TextStyle.Checkbox,
		text: 'Task',
		checked: true,
	},
};

export const Callout: Story = {
	args: {
		style: I.TextStyle.Callout,
		text: 'Note',
		icon: '💡',
	},
};

export const Quote: Story = {
	args: {
		style: I.TextStyle.Quote,
		text: 'A quote',
	},
};

export const Bulleted: Story = {
	args: {
		style: I.TextStyle.Bulleted,
		text: 'List item',
	},
};
