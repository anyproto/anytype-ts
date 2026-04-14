import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../.storybook/decorators';
import BlockIconPage from './iconPage';
import * as I from 'Interface';

import '../util/icons/object';
import '../util/icons/type';
import '../util/icons/default';

const ROOT = 'sb-icon-page';

const meta: Meta<typeof BlockIconPage> = {
	title: 'Block/IconPage',
	component: BlockIconPage,
	tags: ['autodocs'],
	decorators: [ withBlock('blockIconPage') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

const setup = (details: any) => {
	S.Detail.update(ROOT, { id: ROOT, details }, false);
};

export const PageWithEmoji: Story = {
	decorators: [
		(Story) => {
			setup({
				layout: I.ObjectLayout.Page,
				name: 'My Page',
				iconEmoji: '\uD83D\uDE80',
			});
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
	},
};

export const PageDefault: Story = {
	decorators: [
		(Story) => {
			setup({
				layout: I.ObjectLayout.Page,
				name: 'Untitled',
			});
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: false,
	},
};

export const TypeIcon: Story = {
	decorators: [
		(Story) => {
			setup({
				layout: I.ObjectLayout.Type,
				name: 'Task',
				iconName: 'checkbox',
				iconOption: 4,
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
				layout: I.ObjectLayout.Page,
				name: 'Read Only',
				iconEmoji: '\uD83D\uDD12',
			});
			return <Story />;
		},
	],
	args: {
		rootId: ROOT,
		readonly: true,
	},
};
