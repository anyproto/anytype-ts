import type { Meta, StoryObj } from '@storybook/react';
import PopupShare from './share';

const meta: Meta<typeof PopupShare> = {
	title: 'Popup/Share',
	component: PopupShare,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 400, padding: 24 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: 'share-default',
		param: { data: {} },
		close: () => {},
	},
};
