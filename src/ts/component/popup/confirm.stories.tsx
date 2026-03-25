import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import PopupConfirm from './confirm';

const meta: Meta<typeof PopupConfirm> = {
	title: 'Popup/Confirm',
	component: PopupConfirm,
	tags: ['autodocs'],
	decorators: [
		withPopup('Confirm'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...popupProps('confirm-default', {
			title: 'Confirm Action',
			text: 'Are you sure you want to proceed with this action?',
			onConfirm: () => {},
			onCancel: () => {},
		}),
	},
};

export const IconConfirm: Story = {
	args: {
		...popupProps('confirm-icon-confirm', {
			title: 'Remove from Favorites',
			text: 'This object will be removed from your favorites list.',
			iconParam: { name: 'popup/header/confirm', color: 'orange', size: 56 },
			textConfirm: 'Remove',
			onConfirm: () => {},
			onCancel: () => {},
		}),
	},
};

export const IconWarning: Story = {
	args: {
		...popupProps('confirm-icon-warning', {
			title: 'Unsaved Changes',
			text: 'You have unsaved changes that will be lost if you continue.',
			iconParam: { name: 'popup/header/warning', color: 'orange', size: 56 },
			textConfirm: 'Discard',
			colorConfirm: 'red',
			onConfirm: () => {},
			onCancel: () => {},
		}),
	},
};

export const IconError: Story = {
	args: {
		...popupProps('confirm-icon-error', {
			title: 'Connection Error',
			text: 'Failed to connect to the network. Please check your connection and try again.',
			iconParam: { name: 'popup/header/error', color: 'orange', size: 56 },
			textConfirm: 'Retry',
			onConfirm: () => {},
			onCancel: () => {},
		}),
	},
};

export const IconRedLock: Story = {
	args: {
		...popupProps('confirm-icon-redlock', {
			title: 'Transfer Ownership',
			text: 'This action will transfer full ownership of this space. You will lose admin privileges.',
			iconParam: { name: 'popup/header/redLock', color: 'red', size: 56 },
			colorConfirm: 'red',
			textConfirm: 'Transfer',
			onConfirm: () => {},
			onCancel: () => {},
		}),
	},
};

export const IconSuccess: Story = {
	args: {
		...popupProps('confirm-icon-success', {
			title: 'Space Created',
			text: 'Your new workspace has been successfully created and is ready to use.',
			iconParam: { name: 'popup/header/success', color: 'green', size: 56 },
			canCancel: false,
			textConfirm: 'Open Space',
			onConfirm: () => {},
		}),
	},
};

export const IconUpdate: Story = {
	args: {
		...popupProps('confirm-icon-update', {
			title: 'Update Available',
			text: 'A new version of Anytype is ready to install. Restart to apply the update.',
			iconParam: { name: 'popup/header/update', color: 'lime', size: 56 },
			textConfirm: 'Restart Now',
			textCancel: 'Later',
			onConfirm: () => {},
			onCancel: () => {},
		}),
	},
};

export const IconKey: Story = {
	args: {
		...popupProps('confirm-icon-key', {
			title: 'Recovery Key',
			text: 'Make sure you have saved your recovery key in a safe place before proceeding.',
			iconParam: { name: 'popup/header/key', color: 'orange', size: 56 },
			textConfirm: 'I Saved It',
			onConfirm: () => {},
			onCancel: () => {},
		}),
	},
};

export const IconLock: Story = {
	args: {
		...popupProps('confirm-icon-lock', {
			title: 'Space Locked',
			text: 'This space is read-only. You need editor permissions to make changes.',
			iconParam: { name: 'popup/header/lock', color: 'orange', size: 56 },
			canCancel: false,
			textConfirm: 'Got It',
			onConfirm: () => {},
		}),
	},
};

export const IconInvite: Story = {
	args: {
		...popupProps('confirm-icon-invite', {
			title: 'Join Space',
			text: 'You have been invited to join this shared workspace.',
			iconParam: { name: 'popup/header/invite', color: 'orange', size: 56 },
			textConfirm: 'Accept',
			textCancel: 'Decline',
			colorConfirm: 'accent',
			onConfirm: () => {},
			onCancel: () => {},
		}),
	},
};

export const WithConfirmMessage: Story = {
	args: {
		...popupProps('confirm-message', {
			title: 'Delete Space',
			text: 'Type "DELETE" to confirm permanent deletion of this space.',
			iconParam: { name: 'popup/header/warning', color: 'red', size: 56 },
			confirmMessage: 'DELETE',
			colorConfirm: 'red',
			textConfirm: 'Delete Permanently',
			onConfirm: () => {},
			onCancel: () => {},
		}),
	},
};

export const CustomButtons: Story = {
	args: {
		...popupProps('confirm-custom', {
			title: 'Unsaved Changes',
			text: 'You have unsaved changes. Would you like to save before leaving?',
			textConfirm: 'Save & Leave',
			textCancel: 'Discard',
			colorConfirm: 'accent',
			colorCancel: 'red',
			onConfirm: () => {},
			onCancel: () => {},
		}),
	},
};

export const ConfirmOnly: Story = {
	args: {
		...popupProps('confirm-only', {
			title: 'Welcome!',
			text: 'Your workspace has been created successfully.',
			iconParam: { name: 'popup/header/success', color: 'green', size: 56 },
			canCancel: false,
			textConfirm: 'Get Started',
			onConfirm: () => {},
		}),
	},
};
