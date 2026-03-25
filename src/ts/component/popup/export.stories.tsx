import type { Meta, StoryObj } from '@storybook/react';
import PopupExport from './export';

const noop = () => {};

const meta: Meta<typeof PopupExport> = {
	title: 'Popup/Export',
	component: PopupExport,
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
		id: 'export-default',
		param: { data: {} },
		close: noop,
		storageGet: () => ({}),
		storageSet: noop,
	},
};
