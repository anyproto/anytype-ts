import type { Meta, StoryObj } from '@storybook/react';
import HeaderAuthLogout from './logout';

const meta: Meta<typeof HeaderAuthLogout> = {
	title: 'Header/AuthLogout',
	component: HeaderAuthLogout,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div className="header isAuth" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 52 }}>
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
