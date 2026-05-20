import type { Meta, StoryObj } from '@storybook/react';
import ObjectDescription from './description';

const meta: Meta<typeof ObjectDescription> = {
	title: 'Util/Object/Description',
	component: ObjectDescription,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		object: { description: 'A simple text description for this object.' },
	},
};

export const WithHtml: Story = {
	args: {
		object: { description: 'Description with <strong>bold</strong> and <em>italic</em> text.' },
	},
};

export const LongDescription: Story = {
	args: {
		object: { description: 'This is a much longer description that spans multiple lines. It contains detailed information about the object, including its purpose, usage, and any relevant notes that the user might need to know about.' },
	},
};

export const Empty: Story = {
	args: {
		object: { description: '' },
	},
};

export const CustomClassName: Story = {
	args: {
		object: { description: 'Description with custom class' },
		className: 'descr',
	},
};
