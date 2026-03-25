import type { Meta, StoryObj } from '@storybook/react';
import PopupUpload from './upload';

const noop = () => {};

const meta: Meta<typeof PopupUpload> = {
	title: 'Popup/Upload',
	component: PopupUpload,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 480, padding: 24 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: 'upload-default',
		param: {
			data: {
				layout: 0,
				onUpload: noop,
				route: 'storybook',
			},
		},
		close: noop,
	},
};
