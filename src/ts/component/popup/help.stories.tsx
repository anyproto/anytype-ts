import type { Meta, StoryObj } from '@storybook/react';
import PopupHelp from './help';

const noop = () => {};

const meta: Meta<typeof PopupHelp> = {
	title: 'Popup/Help',
	component: PopupHelp,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 680, maxHeight: 600, overflow: 'auto' }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const WhatsNew: Story = {
	args: {
		id: 'help-whatsnew',
		getId: () => 'help-whatsnew',
		param: { data: { document: 'whatsNew' } },
		close: noop,
	},
};
