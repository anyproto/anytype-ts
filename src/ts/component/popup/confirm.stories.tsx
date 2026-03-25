import type { Meta, StoryObj } from '@storybook/react';
import PopupConfirm from './confirm';

const noop = () => {};

const meta: Meta<typeof PopupConfirm> = {
	title: 'Popup/Confirm',
	component: PopupConfirm,
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
		id: 'confirm-default',
		param: {
			data: {
				title: 'Confirm Action',
				text: 'Are you sure you want to proceed with this action?',
				onConfirm: noop,
				onCancel: noop,
			},
		},
		close: noop,
	},
};

export const WithIcon: Story = {
	args: {
		id: 'confirm-icon',
		param: {
			data: {
				title: 'Delete Object',
				text: 'This action cannot be undone. The object and all its data will be permanently removed.',
				iconParam: { name: 'common/alert', color: 'red', size: 56 },
				colorConfirm: 'red',
				textConfirm: 'Delete',
				onConfirm: noop,
				onCancel: noop,
			},
		},
		close: noop,
	},
};

export const ConfirmOnly: Story = {
	args: {
		id: 'confirm-only',
		param: {
			data: {
				title: 'Welcome!',
				text: 'Your workspace has been created successfully.',
				canCancel: false,
				textConfirm: 'Get Started',
				onConfirm: noop,
			},
		},
		close: noop,
	},
};

export const WithConfirmMessage: Story = {
	args: {
		id: 'confirm-message',
		param: {
			data: {
				title: 'Delete Space',
				text: 'Type "DELETE" to confirm permanent deletion of this space.',
				confirmMessage: 'DELETE',
				colorConfirm: 'red',
				textConfirm: 'Delete Permanently',
				onConfirm: noop,
				onCancel: noop,
			},
		},
		close: noop,
	},
};

export const CustomButtons: Story = {
	args: {
		id: 'confirm-custom',
		param: {
			data: {
				title: 'Unsaved Changes',
				text: 'You have unsaved changes. Would you like to save before leaving?',
				textConfirm: 'Save & Leave',
				textCancel: 'Discard',
				colorConfirm: 'accent',
				colorCancel: 'red',
				onConfirm: noop,
				onCancel: noop,
			},
		},
		close: noop,
	},
};
