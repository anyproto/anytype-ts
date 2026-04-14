import type { Meta, StoryObj } from '@storybook/react';
import MediaState from './mediaState';

const meta: Meta<typeof MediaState> = {
	title: 'Util/MediaState',
	component: MediaState,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Deleted: Story = {
	args: {
		isDeleted: true,
		isArchived: false,
		typeName: 'Image',
		fileName: 'photo.jpg',
	},
};

export const Archived: Story = {
	args: {
		isDeleted: false,
		isArchived: true,
		typeName: 'File',
		fileName: 'document.pdf',
	},
};

export const Neither: Story = {
	args: {
		isDeleted: false,
		isArchived: false,
		typeName: 'Page',
	},
};
