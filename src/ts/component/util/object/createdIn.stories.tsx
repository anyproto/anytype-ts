import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ObjectCreatedIn from './createdIn';
import * as I from 'Interface';

const ROOT = 'sb-created-in';
const CONTEXT = 'sb-created-in-context';

const meta: Meta<typeof ObjectCreatedIn> = {
	title: 'Util/Object/CreatedIn',
	component: ObjectCreatedIn,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

const seed = (name: string) => (Story: any) => {
	S.Detail.update(ROOT, { id: ROOT, details: {
		layout: I.ObjectLayout.Image,
		createdInContext: CONTEXT,
		createdInContextRef: 'block-id',
	}}, false);
	S.Detail.update(ROOT, { id: CONTEXT, details: {
		name,
		layout: I.ObjectLayout.Page,
	}}, false);
	return <Story />;
};

export const Default: Story = {
	decorators: [ seed('Q3 Meeting notes') ],
	args: {
		rootId: ROOT,
	},
};

export const LongName: Story = {
	decorators: [ seed('A very long context object name that should be truncated with an ellipsis while the tooltip keeps the full name') ],
	args: {
		rootId: ROOT,
	},
};

export const WithoutContext: Story = {
	args: {
		rootId: 'sb-created-in-none',
	},
};
