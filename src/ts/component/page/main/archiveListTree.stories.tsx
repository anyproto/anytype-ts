import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageMainArchiveListTree from './archiveListTree';

const meta: Meta<typeof PageMainArchiveListTree> = {
	title: 'Page/Main/ArchiveListTree',
	component: PageMainArchiveListTree,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		isPopup: false,
	},
};
