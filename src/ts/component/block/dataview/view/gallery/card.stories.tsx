import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import GalleryCard from './card';
import * as I from 'Interface';
import * as M from 'Model';

const noop = () => {};

const meta: Meta<typeof GalleryCard> = {
	title: 'Block/Dataview/View/Gallery/Card',
	component: GalleryCard,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'root',
		block: new M.Block({ id: 'gallery-card-block', type: I.BlockType.Dataview, childrenIds: [], content: {} }),
		readonly: false,
		isInline: false,
		getView: () => new M.View({ id: 'view-1', type: I.ViewType.Gallery } as I.View),
		getTarget: () => ({}),
		getVisibleRelations: () => [],
		loadData: noop,
		onContext: noop,
	},
};
