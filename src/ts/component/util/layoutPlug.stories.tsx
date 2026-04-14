import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import LayoutPlug from './layoutPlug';
import * as I from 'Interface';

const meta: Meta<typeof LayoutPlug> = {
	title: 'Util/LayoutPlug',
	component: LayoutPlug,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 600, minHeight: 200, background: 'var(--color-bg-primary)' }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const PageLayout: Story = {
	args: {
		layoutFormat: I.LayoutFormat.Page,
		recommendedLayout: I.ObjectLayout.Page,
	},
};

export const ListLayout: Story = {
	args: {
		layoutFormat: I.LayoutFormat.List,
		recommendedLayout: I.ObjectLayout.Set,
		viewType: I.ViewType.Grid,
	},
};

export const BoardLayout: Story = {
	args: {
		layoutFormat: I.LayoutFormat.List,
		recommendedLayout: I.ObjectLayout.Set,
		viewType: I.ViewType.Board,
	},
};
