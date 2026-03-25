import type { Meta, StoryObj } from '@storybook/react';
import PopupAbout from './about';

const meta: Meta<typeof PopupAbout> = {
	title: 'Popup/About',
	component: PopupAbout,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 400, padding: 24, textAlign: 'center' }}>
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
