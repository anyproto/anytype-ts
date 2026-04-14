import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ProgressText from './progressText';
import * as I from 'Interface';

const meta: Meta<typeof ProgressText> = {
	title: 'Util/ProgressText',
	component: ProgressText,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

const setProgress = (type: I.ProgressType, current: number, total: number) => {
	S.Progress.listValue = [{
		id: `storybook-${type}`,
		type,
		state: I.ProgressState.Running,
		current,
		total,
		spaceId: '',
	}];
};

export const Downloading: Story = {
	decorators: [
		(Story) => {
			setProgress(I.ProgressType.Drop, 75, 100);
			return <Story />;
		},
	],
	args: {
		type: I.ProgressType.Drop,
		label: 'Downloads',
	},
};

export const Importing: Story = {
	decorators: [
		(Story) => {
			setProgress(I.ProgressType.Import, 30, 100);
			return <Story />;
		},
	],
	args: {
		type: I.ProgressType.Import,
		label: 'Import',
	},
};

export const Exporting: Story = {
	decorators: [
		(Story) => {
			setProgress(I.ProgressType.Export, 90, 100);
			return <Story />;
		},
	],
	args: {
		type: I.ProgressType.Export,
		label: 'Export',
	},
};

export const HalfComplete: Story = {
	decorators: [
		(Story) => {
			setProgress(I.ProgressType.Save, 50, 100);
			return <Story />;
		},
	],
	args: {
		type: I.ProgressType.Save,
		label: 'Saving',
	},
};
