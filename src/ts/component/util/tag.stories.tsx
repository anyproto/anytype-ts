import type { Meta, StoryObj } from '@storybook/react';
import Tag from './tag';

const meta: Meta<typeof Tag> = {
	title: 'Util/Tag',
	component: Tag,
	tags: ['autodocs'],
	argTypes: {
		color: {
			control: 'select',
			options: ['default', 'grey', 'yellow', 'orange', 'red', 'pink', 'purple', 'blue', 'ice', 'teal', 'lime', 'green'],
		},
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		text: 'Tag',
		color: 'default',
	},
};

export const Blue: Story = {
	args: {
		text: 'Feature',
		color: 'blue',
	},
};

export const Red: Story = {
	args: {
		text: 'Bug',
		color: 'red',
	},
};

export const Green: Story = {
	args: {
		text: 'Done',
		color: 'green',
	},
};

export const Editable: Story = {
	args: {
		text: 'Removable',
		color: 'purple',
		canEdit: true,
	},
};

export const Small: Story = {
	args: {
		text: 'Small Tag',
		color: 'orange',
		isSmall: true,
	},
};
