import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import * as I from 'Interface';
import text from 'json/text.json';
import LinkApproval from './linkApproval';
import 'scss/linkApproval.scss';

const payload: I.LinkApprovalPayload = {
	key: 'preview',
	clientInfo: { name: 'Claude', processName: 'Claude', processPath: '/Applications/Claude.app' },
	scope: I.LocalApiScope.Json,
	requestedPerm: I.LocalApiPermission.Read,
	spaces: [
		{ id: 'work', name: 'Work', iconEmoji: '💼' },
		{ id: 'notes', name: 'My notes', iconEmoji: '📒' },
		{ id: 'design', name: 'Design team', iconEmoji: '🎨' },
	],
};

const meta: Meta<typeof LinkApproval> = {
	title: 'Util/LinkApproval',
	component: LinkApproval,
	args: { payload, t: key => text[key] || key },
	render: function Preview(args) {
		const [ challenge, setChallenge ] = useState('');
		return (
			<div style={{ width: 424, height: args.payload.scope == I.LocalApiScope.Json ? 568 : 288 }}>
				<LinkApproval {...args} challenge={args.challenge || challenge} onDecide={allow => { if (allow) setChallenge('3719'); }} />
			</div>
		);
	},
};

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const ManySpaces: Story = {
	args: { payload: { ...payload, spaces: Array.from({ length: 100 }, (_, i) => ({ id: String(i), name: `Team space ${i + 1}` })) } },
};
export const NoSpaces: Story = { args: { payload: { ...payload, spaces: [] } } };
export const RequestedEditing: Story = { args: { payload: { ...payload, requestedPerm: I.LocalApiPermission.ReadWrite } } };
export const Limited: Story = { args: { payload: { ...payload, scope: I.LocalApiScope.Limited } } };
export const Code: Story = { args: { challenge: '3719' } };
export const Retry: Story = { args: { error: true } };
