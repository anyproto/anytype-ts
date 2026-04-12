import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from 'Component';
import { withHorizontalMenu } from '../../../../../.storybook/decorators';

const meta: Meta = {
	title: 'Menu/CommentToolbar',
	tags: ['autodocs'],
	decorators: [ withHorizontalMenu('menuCommentToolbar') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<div className="flex">
			<div className="section first">
				<Icon
					name="menu/block/text/paragraph"
					className="blockStyle" withBackground={true}
					arrow={true}
				/>
			</div>

			<div className="section">
				<Icon name="menu/mark/bold" withBackground={true} />
				<Icon name="menu/mark/italic" withBackground={true} />
				<Icon name="menu/mark/strike" withBackground={true} />
				<Icon name="menu/mark/underline" withBackground={true} />
				<Icon name="comment/menu/quote" withBackground={true} />
				<Icon name="comment/menu/code" withBackground={true} />
				<Icon name="menu/mark/link" withBackground={true} />
			</div>
		</div>
	),
};

export const WithActiveMarks: Story = {
	render: () => (
		<div className="flex">
			<div className="section first">
				<Icon
					name="menu/block/text/header"
					className="blockStyle" withBackground={true}
					arrow={true}
				/>
			</div>

			<div className="section">
				<Icon name="menu/mark/bold" color="default" className="active" withBackground={true} />
				<Icon name="menu/mark/italic" color="default" className="active" withBackground={true} />
				<Icon name="menu/mark/strike" withBackground={true} />
				<Icon name="menu/mark/underline" withBackground={true} />
				<Icon name="comment/menu/quote" color="default" className="active" withBackground={true} />
				<Icon name="comment/menu/code" withBackground={true} />
				<Icon name="menu/mark/link" withBackground={true} />
			</div>
		</div>
	),
};
