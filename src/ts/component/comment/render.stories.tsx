import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { renderParts } from './render';

const RenderWrapper = (props: { parts: any[] }) => {
	return <>{renderParts(props.parts)}</>;
};

const meta: Meta<typeof RenderWrapper> = {
	title: 'Comment/Render',
	component: RenderWrapper,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		parts: [],
	},
};
