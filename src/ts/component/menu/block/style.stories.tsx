import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MenuItemVertical } from 'Component';
import { withMenuClass } from '../../../../../.storybook/decorators';

const meta: Meta = {
	title: 'Menu/BlockStyle',
	tags: ['autodocs'],
	decorators: [ withMenuClass('menuBlockStyle') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

const textItems: any[] = [
	{ id: 'paragraph', className: 'textStyleParagraph', name: 'Text' },
	{ id: 'header1', className: 'textStyleHeader1', name: 'Title' },
	{ id: 'header2', className: 'textStyleHeader2', name: 'Heading' },
	{ id: 'header3', className: 'textStyleHeader3', name: 'Subheading' },
	{ id: 'div-text', isDiv: true },
	{ id: 'quote', iconParam: { name: 'menu/block/text/quote' }, name: 'Highlighted' },
	{ id: 'callout', iconParam: { name: 'menu/block/text/callout' }, name: 'Callout' },
];

const listItems = [
	{ id: 'checkbox', iconParam: { name: 'menu/block/text/checkbox', color: 'accent100' }, name: 'Checkbox' },
	{ id: 'bulleted', iconParam: { name: 'menu/block/text/bulleted' }, name: 'Bulleted list' },
	{ id: 'numbered', iconParam: { name: 'menu/block/text/numbered' }, name: 'Numbered list' },
	{ id: 'toggle', iconParam: { name: 'menu/block/text/toggle' }, name: 'Toggle' },
	{ id: 'toggleHeader1', iconParam: { name: 'menu/block/text/toggleHeader' }, name: 'Toggle heading 1' },
	{ id: 'toggleHeader2', iconParam: { name: 'menu/block/text/toggleHeader' }, name: 'Toggle heading 2' },
	{ id: 'toggleHeader3', iconParam: { name: 'menu/block/text/toggleHeader' }, name: 'Toggle heading 3' },
];

export const TextStyles: Story = {
	render: () => (
		<div>
			{textItems.map((item, i) => (
				<MenuItemVertical
					key={i}
					{...item}
					checkbox={item.id == 'paragraph'}
				/>
			))}
		</div>
	),
};

export const ListStyles: Story = {
	render: () => (
		<div>
			{listItems.map((item, i) => (
				<MenuItemVertical
					key={i}
					{...item}
					checkbox={item.id == 'bulleted'}
				/>
			))}
		</div>
	),
};

export const AllSections: Story = {
	render: () => (
		<div>
			{textItems.map((item, i) => (
				<MenuItemVertical
					key={`text-${i}`}
					{...item}
					checkbox={item.id == 'header1'}
				/>
			))}
			{listItems.map((item, i) => (
				<MenuItemVertical
					key={`list-${i}`}
					{...item}
				/>
			))}
		</div>
	),
};
