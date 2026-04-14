import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../.storybook/decorators';
import BlockIconUser from './iconUser';
import * as I from 'Interface';

import '../util/icons/object';
import '../util/icons/type';
import '../util/icons/default';

const ROOT = 'sb-icon-user';

const meta: Meta<typeof BlockIconUser> = {
	title: 'Block/IconUser',
	component: BlockIconUser,
	tags: ['autodocs'],
	decorators: [ withBlock('blockIconUser') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

const setup = (details: any) => {
	S.Detail.update(ROOT, { id: ROOT, details }, false);
};

export const HumanLetter: Story = {
	decorators: [
		(Story) => {
			setup({
				layout: I.ObjectLayout.Human,
				name: 'Alexey',
			});
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
	},
};

export const HumanDefault: Story = {
	decorators: [
		(Story) => {
			setup({
				layout: I.ObjectLayout.Human,
				name: '',
			});
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
	},
};

export const Readonly: Story = {
	decorators: [
		(Story) => {
			setup({
				layout: I.ObjectLayout.Human,
				name: 'Christopher',
			});
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: true,
	},
};
