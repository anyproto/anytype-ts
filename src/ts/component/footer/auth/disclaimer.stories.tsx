import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import FooterAuthDisclaimer from './disclaimer';

const meta: Meta<typeof FooterAuthDisclaimer> = {
	title: 'Footer/AuthDisclaimer',
	component: FooterAuthDisclaimer,
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
