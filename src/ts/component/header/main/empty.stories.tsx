import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withHeader } from '../../../../../.storybook/decorators';
import HeaderMainEmpty from './empty';

const noop = () => {};

const renderLeftIcons = () => (
	<>
		<div className="icon withBackground" />
		<div className="icon withBackground" />
	</>
);

const meta: Meta<typeof HeaderMainEmpty> = {
	title: 'Header/MainEmpty',
	component: HeaderMainEmpty,
	tags: ['autodocs'],
	decorators: [ withHeader('mainEmpty') ],
	args: {
		renderLeftIcons,
		onSearch: noop,
		onTooltipShow: noop,
		onTooltipHide: noop,
		menuOpen: noop,
		rootId: 'root',
		isPopup: false,
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
