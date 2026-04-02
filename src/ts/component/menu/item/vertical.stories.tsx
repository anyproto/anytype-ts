import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import MenuItemVertical from './vertical';
import { withMenu } from '../../../../../.storybook/decorators';

const meta: Meta<typeof MenuItemVertical> = {
	title: 'Menu/ItemVertical',
	component: MenuItemVertical,
	tags: ['autodocs'],
	decorators: [ withMenu ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: 'item-1',
		name: 'Menu Item',
	},
};

export const WithIcon: Story = {
	args: {
		id: 'item-icon',
		name: 'Settings',
		iconParam: { name: 'header/settings', size: 20 },
	},
};

export const WithDescription: Story = {
	args: {
		id: 'item-descr',
		name: 'Advanced Settings',
		description: 'Configure advanced options for your workspace',
		withDescription: true,
		iconParam: { name: 'header/settings', size: 20 },
	},
};

export const WithArrow: Story = {
	args: {
		id: 'item-arrow',
		name: 'More Options',
		arrow: true,
	},
};

export const WithCaption: Story = {
	args: {
		id: 'item-caption',
		name: 'Language',
		caption: 'English',
	},
};

export const WithSwitch: Story = {
	args: {
		id: 'item-switch',
		name: 'Dark Mode',
		withSwitch: true,
		switchValue: false,
	},
};

export const SwitchOn: Story = {
	args: {
		id: 'item-switch-on',
		name: 'Notifications',
		withSwitch: true,
		switchValue: true,
	},
};

export const WithCheckbox: Story = {
	args: {
		id: 'item-checkbox',
		name: 'Selected Item',
		checkbox: true,
	},
};

export const Active: Story = {
	args: {
		id: 'item-active',
		name: 'Active Item',
		isActive: true,
		iconParam: { name: 'menu/common/chk', size: 20 },
	},
};

export const WithColor: Story = {
	args: {
		id: 'item-color',
		name: 'Delete',
		color: 'red',
	},
};

export const Section: Story = {
	args: {
		id: 'item-section',
		name: 'Section Title',
		isSection: true,
	},
};

export const Divider: Story = {
	args: {
		id: 'item-div',
		isDiv: true,
	},
};

export const Readonly: Story = {
	args: {
		id: 'item-readonly',
		name: 'Readonly Item',
		readonly: true,
	},
};

export const WithMore: Story = {
	args: {
		id: 'item-more',
		name: 'Editable Item',
		withMore: true,
		onMore: () => {},
	},
};

export const MenuList: Story = {
	render: () => (
		<>
			<MenuItemVertical id="s1" name="Actions" isSection={true} index={0} />
			<MenuItemVertical id="i1" name="Turn into" iconParam={{ name: 'menu/block/text/paragraph', size: 20 }} arrow={true} />
			<MenuItemVertical id="i2" name="Move to" iconParam={{ name: 'menu/action/move', size: 20 }} />
			<MenuItemVertical id="i3" name="Duplicate" iconParam={{ name: 'menu/action/duplicate', size: 20 }} caption="Ctrl+D" />
			<MenuItemVertical id="d1" isDiv={true} />
			<MenuItemVertical id="i4" name="Delete" color="red" iconParam={{ name: 'menu/action/remove', size: 20 }} />
		</>
	),
};
