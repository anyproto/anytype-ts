import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Toast from './toast';
import * as I from 'Interface';

const meta: Meta<typeof Toast> = {
	title: 'Util/Toast',
	component: Toast,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ position: 'relative', width: '100%', minHeight: 80 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

const setToast = (toast: I.Toast) => {
	S.Common.toastObj = toast;
};

export const SimpleText: Story = {
	decorators: [
		(Story) => {
			setToast({ action: I.ToastAction.None, text: 'Copied to clipboard' });
			return <Story />;
		},
	],
};

export const WithCheckIcon: Story = {
	decorators: [
		(Story) => {
			setToast({ action: I.ToastAction.None, text: 'Changes saved successfully', icon: 'check' });
			return <Story />;
		},
	],
};

export const WithNoticeIcon: Story = {
	decorators: [
		(Story) => {
			setToast({ action: I.ToastAction.None, text: 'Storage limit exceeded', icon: 'notice' });
			return <Story />;
		},
	],
};

export const ObjectLocked: Story = {
	decorators: [
		(Story) => {
			setToast({
				action: I.ToastAction.Lock,
				value: true,
				object: { id: 'obj-1', name: 'My Document', layout: 0 },
			});
			return <Story />;
		},
	],
};

export const ObjectUnlocked: Story = {
	decorators: [
		(Story) => {
			setToast({
				action: I.ToastAction.Lock,
				value: false,
				object: { id: 'obj-1', name: 'My Document', layout: 0 },
			});
			return <Story />;
		},
	],
};

export const TemplateCreated: Story = {
	decorators: [
		(Story) => {
			setToast({
				action: I.ToastAction.TemplateCreate,
				object: { id: 'obj-1', name: 'Meeting Notes', layout: 0 },
			});
			return <Story />;
		},
	],
};
