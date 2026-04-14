import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import AddRow from './add';

const noop = () => {};

const meta: Meta<typeof AddRow> = {
	title: 'Block/Dataview/View/Grid/Body/Add',
	component: AddRow,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
