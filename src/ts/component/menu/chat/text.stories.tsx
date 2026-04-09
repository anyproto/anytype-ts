import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from 'Component';
import { withHorizontalMenu } from '../../../../../.storybook/decorators';

const meta: Meta = {
	title: 'Menu/ChatText',
	tags: ['autodocs'],
	decorators: [ withHorizontalMenu('menuChatText') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<div className="buttons">
			<Icon name="menu/mark/bold" />
			<Icon name="menu/mark/italic" />
			<Icon name="menu/mark/strike" />
			<Icon name="menu/mark/underline" />
			<Icon name="menu/mark/link" />
			<Icon name="menu/mark/code" />
		</div>
	),
};

export const WithActiveMarks: Story = {
	render: () => (
		<div className="buttons">
			<Icon name="menu/mark/bold" color="default" className="active" />
			<Icon name="menu/mark/italic" />
			<Icon name="menu/mark/strike" color="default" className="active" />
			<Icon name="menu/mark/underline" />
			<Icon name="menu/mark/link" />
			<Icon name="menu/mark/code" />
		</div>
	),
};
