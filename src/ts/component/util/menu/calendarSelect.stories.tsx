import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import CalendarSelect from './calendarSelect';

const meta: Meta<typeof CalendarSelect> = {
	title: 'Util/Menu/CalendarSelect',
	component: CalendarSelect,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 300 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		value: Math.floor(Date.now() / 1000),
		onChange: () => {},
	},
};

export const WithFooter: Story = {
	args: {
		value: Math.floor(Date.now() / 1000),
		onChange: () => {},
		showFooter: true,
		canClear: true,
	},
};

export const ReadOnly: Story = {
	args: {
		value: Math.floor(Date.now() / 1000),
		onChange: () => {},
		isReadonly: true,
	},
};
