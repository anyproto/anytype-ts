import type { Meta, StoryObj } from '@storybook/react';
import ObjectName from './name';

const meta: Meta<typeof ObjectName> = {
	title: 'Util/Object/Name',
	component: ObjectName,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		object: { name: 'My First Document' },
	},
};

export const Empty: Story = {
	args: {
		object: { name: '' },
	},
};

export const LongName: Story = {
	args: {
		object: { name: 'This is a very long object name that might need to be truncated or wrapped depending on the container width' },
	},
};

export const Deleted: Story = {
	args: {
		object: { name: 'Deleted Object', isDeleted: true },
	},
};

export const WithPronoun: Story = {
	args: {
		object: { name: 'John Doe' },
		withPronoun: true,
	},
};

export const CustomClassName: Story = {
	args: {
		object: { name: 'Custom Styled Name' },
		className: 'name',
	},
};
