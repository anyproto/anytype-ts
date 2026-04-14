import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import TableOfContents from './tableOfContents';

const meta: Meta<typeof TableOfContents> = {
	title: 'Page/Elements/TableOfContents',
	component: TableOfContents,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'sb-root',
	},
};
