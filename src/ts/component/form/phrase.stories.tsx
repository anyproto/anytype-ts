import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Phrase from './phrase';

const meta: Meta<typeof Phrase> = {
	title: 'Form/Phrase',
	component: Phrase,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 400 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		placeholder: 'Enter your recovery phrase...',
	},
};

export const WithValue: Story = {
	args: {
		value: 'apple banana cherry dragon elephant fox grape',
		placeholder: 'Enter your recovery phrase...',
	},
};

export const Hidden: Story = {
	args: {
		value: 'secret words that should be masked',
		isHidden: true,
		placeholder: 'Enter your recovery phrase...',
	},
};

export const Readonly: Story = {
	args: {
		value: 'these words cannot be edited',
		readonly: true,
	},
};

export const ReadonlyHidden: Story = {
	args: {
		value: 'hidden readonly phrase content',
		readonly: true,
		isHidden: true,
	},
};
