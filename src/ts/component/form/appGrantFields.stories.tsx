import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withPopup } from '../../../../.storybook/decorators';
import text from 'json/text.json';
import * as I from 'Interface';
import AppGrantFields from './appGrantFields';

const spaces = [
	{ id: 'space-1', name: 'Personal', iconEmoji: '' },
	{ id: 'space-2', name: 'Work', iconEmoji: '' },
	{ id: 'space-3', name: 'Family', iconEmoji: '' },
];

/** Keeps the grant in story state, as a real caller does */
const Stateful = (props: React.ComponentProps<typeof AppGrantFields>) => {
	const [ value, setValue ] = useState<I.LinkAppGrant>(props.value);

	return (
		<div className="apiKeyEditor">
			<AppGrantFields {...props} value={value} onChange={setValue} />
		</div>
	);
};

const meta: Meta<typeof AppGrantFields> = {
	title: 'Form/AppGrantFields',
	component: AppGrantFields,
	decorators: [ withPopup('ApiCreate') ],
	render: args => <Stateful {...args} />,
	args: {
		spaces,
		value: { spaceIds: [ 'space-1' ], allSpaces: false, perm: I.LocalApiPermission.Read },
		withPermission: true,
		t: key => text[key] || key,
		onChange: () => {},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The AI apps sheet asks for the permission in its own sentence */
export const WithoutPermission: Story = { args: { withPermission: false, value: { spaceIds: [], allSpaces: true, perm: I.LocalApiPermission.ReadWrite } } };

export const Highlighted: Story = { args: { highlight: true, value: { spaceIds: [], allSpaces: false, perm: I.LocalApiPermission.Read } } };
