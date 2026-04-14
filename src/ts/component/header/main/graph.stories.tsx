import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withHeader } from '../../../../../.storybook/decorators';
import HeaderMainGraph from './graph';

const noop = () => {};

const renderLeftIcons = () => (
	<>
		<div className="icon withBackground" />
		<div className="icon withBackground" />
	</>
);

const renderTabs = () => (
	<div id="tabs" className="tabs">
		<div className="tab active">All</div>
		<div className="tab">Recent</div>
	</div>
);

const meta: Meta<typeof HeaderMainGraph> = {
	title: 'Header/MainGraph',
	component: HeaderMainGraph,
	tags: ['autodocs'],
	decorators: [ withHeader('mainGraph') ],
	args: {
		renderLeftIcons,
		renderTabs,
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
