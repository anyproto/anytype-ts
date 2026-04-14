import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ViewTimeline from './timeline';
import * as I from 'Interface';
import * as M from 'Model';

const noop = () => {};

const meta: Meta<typeof ViewTimeline> = {
	title: 'Block/Dataview/View/Timeline',
	component: ViewTimeline,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: 'root',
		block: new M.Block({ id: 'timeline-block', type: I.BlockType.Dataview, childrenIds: [], content: {} }),
		readonly: false,
		isInline: false,
		isCollection: false,
		getView: () => new M.View({ id: 'view-1', type: I.ViewType.Timeline } as I.View),
		getTarget: () => ({}),
		getVisibleRelations: () => [],
		getSources: () => [],
		loadData: noop,
		onRecordAdd: noop,
		onContext: noop,
	},
};
