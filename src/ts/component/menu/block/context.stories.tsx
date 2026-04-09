import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from 'Component';
import { withHorizontalMenu } from '../../../../../.storybook/decorators';

const meta: Meta = {
	title: 'Menu/BlockContext',
	tags: ['autodocs'],
	decorators: [ withHorizontalMenu('menuBlockContext') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<div className="flex">
			<div className="section">
				<Icon
					name="menu/block/text/paragraph"
					arrow={true}
					className="blockStyle"
				/>
			</div>

			<div className="section">
				<Icon name="menu/mark/bold" />
				<Icon name="menu/mark/italic" />
				<Icon name="menu/mark/strike" />
				<Icon name="menu/mark/underline" />
				<Icon name="menu/mark/link" />
				<Icon name="menu/mark/code" />
			</div>

			<div className="section">
				<Icon className="color" inner={<div className="inner textColor textColor-default" />} />
				<Icon className="color" inner={<div className="inner bgColor bgColor-default" />} />
			</div>

			<div className="section">
				<Icon name="common/more" className="more" />
			</div>
		</div>
	),
};

export const WithActiveMarks: Story = {
	render: () => (
		<div className="flex">
			<div className="section">
				<Icon
					name="menu/block/text/header"
					arrow={true}
					className="blockStyle"
				/>
			</div>

			<div className="section">
				<Icon name="menu/mark/bold" color="default" className="active" />
				<Icon name="menu/mark/italic" color="default" className="active" />
				<Icon name="menu/mark/strike" />
				<Icon name="menu/mark/underline" />
				<Icon name="menu/mark/link" />
				<Icon name="menu/mark/code" />
			</div>

			<div className="section">
				<Icon className="color" inner={<div className="inner textColor textColor-red" />} />
				<Icon className="color" inner={<div className="inner bgColor bgColor-yellow" />} />
			</div>

			<div className="section">
				<Icon name="common/more" className="more" />
			</div>
		</div>
	),
};

export const NoTurnInto: Story = {
	name: 'Without Turn Into',
	render: () => (
		<div className="flex">
			<div className="section">
				<Icon name="menu/mark/bold" />
				<Icon name="menu/mark/italic" />
				<Icon name="menu/mark/strike" />
				<Icon name="menu/mark/underline" />
				<Icon name="menu/mark/link" />
				<Icon name="menu/mark/code" />
			</div>

			<div className="section">
				<Icon className="color" inner={<div className="inner textColor textColor-default" />} />
				<Icon className="color" inner={<div className="inner bgColor bgColor-default" />} />
			</div>

			<div className="section">
				<Icon name="common/more" className="more" />
			</div>
		</div>
	),
};
