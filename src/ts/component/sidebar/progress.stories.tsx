import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ProgressItem, ProgressItemProps } from './progress';
import { ProgressType, ImportPhase, ImportRunState, ImportCancelEffect, ImportStatistic, ImportType } from 'Interface';

const statistic = (param: Partial<ImportStatistic>): ImportStatistic => ({
	importId: '6a834c1561fab20e9ba228cb',
	processId: '6a834c1561fab20e9ba228ca',
	importType: ImportType.Notion,
	phase: ImportPhase.Fetching,
	phaseStartedAt: Date.now() - 60000,
	totalsKnown: true,
	pagesTotal: 439,
	pagesDone: 128,
	filesTotal: 0,
	filesDone: 33,
	bytesTotal: 0,
	bytesDone: 13452483,
	state: ImportRunState.Running,
	resumesInMs: 0,
	attempt: 0,
	attemptsMax: 0,
	errorMessage: '',
	itemsPerSecond: 0.3,
	estimatedRemainingMs: 1026917,
	cancelEffect: ImportCancelEffect.NothingToUndo,
	objectsCreated: 0,
	safeToClose: true,
	warningCount: 583,
	errorCount: 2,
	currentItem: 'Quick Drop Inbox',
	...param,
});

const meta: Meta<typeof ProgressItem> = {
	title: 'Sidebar/ProgressItem',
	component: ProgressItem,
	tags: ['autodocs'],
	argTypes: {
		type: {
			control: 'select',
			options: [
				ProgressType.Drop,
				ProgressType.Import,
				ProgressType.Export,
				ProgressType.Save,
				ProgressType.Migrate,
				ProgressType.Update,
			],
		},
	},
	decorators: [
		(Story) => (
			<div className="sidebarProgress isExpanded" style={{ position: 'static', width: 288 }}>
				<div className="items">
					<Story />
				</div>
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Downloading: Story = {
	args: {
		id: '1',
		type: ProgressType.Save,
		canCancel: true,
		isError: false,
		current: 35,
		total: 100,
	},
};

export const Importing: Story = {
	args: {
		id: '2',
		type: ProgressType.Import,
		canCancel: true,
		isError: false,
		current: 50,
		total: 200,
	},
};

export const Exporting: Story = {
	args: {
		id: '3',
		type: ProgressType.Export,
		canCancel: true,
		isError: false,
		current: 180,
		total: 200,
	},
};

export const Updating: Story = {
	args: {
		id: '4',
		type: ProgressType.Update,
		canCancel: false,
		isError: false,
		current: 60,
		total: 100,
	},
};

export const CopyingFiles: Story = {
	args: {
		id: '5',
		type: ProgressType.Drop,
		canCancel: true,
		isError: false,
		current: 10,
		total: 50,
	},
};

export const WithError: Story = {
	args: {
		id: '6',
		type: ProgressType.Import,
		canCancel: false,
		isError: true,
		current: 0,
		total: 0,
		error: 'Connection failed',
	},
};

export const ZeroProgress: Story = {
	args: {
		id: '7',
		type: ProgressType.Save,
		canCancel: true,
		isError: false,
		current: 0,
		total: 100,
	},
};

export const Complete: Story = {
	args: {
		id: '8',
		type: ProgressType.Export,
		canCancel: true,
		isError: false,
		current: 100,
		total: 100,
	},
};

const importArgs = { id: '10', type: ProgressType.Import, canCancel: true, isError: false };

export const ImportScanning: Story = {
	args: {
		...importArgs,
		statistic: statistic({ phase: ImportPhase.Scanning, totalsKnown: false, pagesDone: 3412, pagesTotal: 0, filesDone: 0, estimatedRemainingMs: 0, warningCount: 0, errorCount: 0, currentItem: '' }),
	},
};

export const ImportAnalyzing: Story = {
	args: {
		...importArgs,
		statistic: statistic({ phase: ImportPhase.Analyzing, estimatedRemainingMs: 0, warningCount: 0, errorCount: 0, currentItem: '' }),
	},
};

// The payload shape a live Notion run emits mid-crawl
export const ImportFetching: Story = {
	args: { ...importArgs, statistic: statistic({}) },
};

// formatNumber groups with a space, so segments must stay atomic or the number itself breaks
export const ImportLargeNumbers: Story = {
	args: {
		...importArgs,
		statistic: statistic({
			pagesDone: 128340,
			pagesTotal: 439812,
			filesDone: 12045,
			filesTotal: 23400,
			warningCount: 158320,
			errorCount: 2410,
			currentItem: 'Q3 Planning — Engineering Roadmap and Milestones',
		}),
	},
};

export const ImportThrottled: Story = {
	args: {
		...importArgs,
		statistic: statistic({ state: ImportRunState.Throttled, resumesInMs: 4000 }),
	},
};

export const ImportRetrying: Story = {
	args: {
		...importArgs,
		statistic: statistic({ state: ImportRunState.Retrying, attempt: 2, attemptsMax: 5 }),
	},
};

export const ImportCreating: Story = {
	args: {
		...importArgs,
		statistic: statistic({
			phase: ImportPhase.Creating,
			pagesDone: 4120,
			pagesTotal: 9650,
			filesDone: 0,
			objectsCreated: 4120,
			cancelEffect: ImportCancelEffect.RemovesCreated,
			currentItem: '',
			estimatedRemainingMs: 42000,
		}),
	},
};

export const ImportStatisticError: Story = {
	args: {
		...importArgs,
		isError: true,
		canCancel: false,
		statistic: statistic({ state: ImportRunState.Error, errorMessage: 'Notion API returned 502' }),
	},
};

const MultipleItemsTemplate = () => {
	const items: ProgressItemProps[] = [
		{ id: '1', type: ProgressType.Import, canCancel: true, isError: false, current: 45, total: 100 },
		{ id: '2', type: ProgressType.Save, canCancel: true, isError: false, current: 80, total: 100 },
		{ id: '3', type: ProgressType.Update, canCancel: false, isError: false, current: 20, total: 100 },
	];

	return (
		<>
			{items.map(item => (
				<ProgressItem key={item.id} {...item} />
			))}
		</>
	);
};

export const MultipleItems: Story = {
	render: () => <MultipleItemsTemplate />,
};
