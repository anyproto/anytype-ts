import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import FooterAuthEmail from './email';

const meta: Meta<typeof FooterAuthEmail> = {
	title: 'Footer/AuthEmail',
	component: FooterAuthEmail,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div className="footer isAuth" style={{ padding: 16, textAlign: 'center' }}>
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
