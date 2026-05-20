import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Loader from './loader';
import * as I from 'Interface';

const meta: Meta<typeof Loader> = {
	title: 'Util/Loader',
	component: Loader,
	tags: ['autodocs'],
	argTypes: {
		type: {
			control: 'select',
			options: [I.LoaderType.Dots, I.LoaderType.Loader],
		},
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Dots: Story = {
	args: {
		type: I.LoaderType.Dots,
	},
};

export const Spinner: Story = {
	args: {
		type: I.LoaderType.Loader,
	},
};

export const WithClassName: Story = {
	args: {
		type: I.LoaderType.Dots,
		className: 'customLoader',
	},
};
