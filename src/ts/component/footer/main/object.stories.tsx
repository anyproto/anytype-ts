import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import FooterMainObject from './object';

const meta: Meta<typeof FooterMainObject> = {
	title: 'Footer/Main/Object',
	component: FooterMainObject,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div className="footer isMain" style={{ padding: 16 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
