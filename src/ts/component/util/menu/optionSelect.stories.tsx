import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import OptionSelect from './optionSelect';

const meta: Meta<typeof OptionSelect> = {
	title: 'Util/Menu/OptionSelect',
	component: OptionSelect,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 280, height: 300 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		subId: 'storybook-option-select',
		relationKey: 'tag',
		value: [],
		onChange: () => {},
	},
};

export const WithValue: Story = {
	args: {
		subId: 'storybook-option-select-val',
		relationKey: 'tag',
		value: ['option-1'],
		onChange: () => {},
	},
};

export const Readonly: Story = {
	args: {
		subId: 'storybook-option-select-ro',
		relationKey: 'tag',
		value: [],
		onChange: () => {},
		isReadonly: true,
	},
};
