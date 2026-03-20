import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Editable from './editable';

const meta: Meta<typeof Editable> = {
	title: 'Form/Editable',
	component: Editable,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 400, border: '1px solid #ddd', borderRadius: 8, padding: 8 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		placeholder: 'Type something...',
	},
};

export const Readonly: Story = {
	args: {
		placeholder: 'Read-only editor',
		readonly: true,
	},
};

export const WithSpellcheck: Story = {
	args: {
		placeholder: 'Spellcheck enabled...',
		spellcheck: true,
	},
};

export const WithMaxLength: Story = {
	args: {
		placeholder: 'Max 50 characters',
		maxLength: 50,
	},
};
