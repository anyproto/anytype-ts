import type { Meta, StoryObj } from '@storybook/react';
import PopupShortcut from './shortcut';

const noop = () => {};

const meta: Meta<typeof PopupShortcut> = {
	title: 'Popup/Shortcut',
	component: PopupShortcut,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 680, padding: 24 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: 'shortcut-default',
		param: { data: {} },
		close: noop,
	},
};
