import type { Meta, StoryObj } from '@storybook/react';
import TabSwitch from './tabSwitch';

const meta: Meta<typeof TabSwitch> = {
	title: 'Form/TabSwitch',
	component: TabSwitch,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const TwoOptions: Story = {
	args: {
		value: 'option1',
		options: [
			{ id: 'option1', name: 'Option 1' },
			{ id: 'option2', name: 'Option 2' },
		],
	},
};

export const ThreeOptions: Story = {
	args: {
		value: 'grid',
		options: [
			{ id: 'grid', name: 'Grid' },
			{ id: 'list', name: 'List' },
			{ id: 'gallery', name: 'Gallery' },
		],
	},
};

export const WithIcons: Story = {
	args: {
		value: 'left',
		options: [
			{ id: 'left', name: 'Left', iconParam: { name: 'menu/align/horizontal/left' } },
			{ id: 'center', name: 'Center', iconParam: { name: 'menu/align/horizontal/center' } },
			{ id: 'right', name: 'Right', iconParam: { name: 'menu/align/horizontal/right' } },
		],
	},
};

export const Readonly: Story = {
	args: {
		value: 'option1',
		readonly: true,
		options: [
			{ id: 'option1', name: 'Option 1' },
			{ id: 'option2', name: 'Option 2' },
		],
	},
};
