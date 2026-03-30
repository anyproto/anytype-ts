import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ProgressItem, ProgressItemProps } from './progress';
import { ProgressType } from 'Interface';

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
