import React, { useLayoutEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { popupProps } from 'SbHelpers/mockData';
import { withPopup } from '../../../../.storybook/decorators';
import { ExportReport, ExportReport_Status, ExportReport_Issue_Severity } from 'Proto/pkg/lib/pb/model/protos/export_report';
import PopupExportResult from './exportResult';
import { dispatcher } from 'Lib/api/dispatcher';

const records = [
	{ id: 'typeid-test', name: 'Archived project type', layout: 4, isArchived: true },
	{ id: 'object-plan', name: 'Project plan', type: [ 'type-page' ], layout: 0, iconEmoji: '📋' },
	{ id: 'object-photo', name: 'Workshop photo.jpg', type: [ 'type-image' ], layout: 8 },
	{ id: 'type-page', name: 'Page', layout: 4 },
	{ id: 'type-image', name: 'Image', layout: 4 },
];

const MockSearch = ({ children }: { children: React.ReactNode }) => {
	const [ ready, setReady ] = useState(false);
	useLayoutEffect(() => {
		const previous = dispatcher.service;
		dispatcher.service = {
			request: (command, data, _metadata, callback) => {
				const ids = data.filters?.find(it => it.RelationKey == 'id')?.value || [];
				callback(null, { error: { code: 0 }, records: command == 'ObjectSearch' ? records.filter(it => ids.includes(it.id)) : [] });
			},
		} as any;
		setReady(true);
		return () => { dispatcher.service = previous; };
	}, []);
	return ready ? <>{children}</> : null;
};

const meta: Meta<typeof PopupExportResult> = {
	title: 'Popup/ExportResult',
	component: PopupExportResult,
	decorators: [ withPopup('ExportResult'), Story => <MockSearch><Story /></MockSearch> ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

const partialReport = ExportReport.fromPartial({
	status: ExportReport_Status.PARTIAL,
	succeed: 124,
	objectErrors: 1,
	fileErrors: 1,
	issues: [
		{ objectId: 'object-photo', severity: ExportReport_Issue_Severity.ERROR, code: 'file_export_failed', path: 'files/Workshop photo.jpg', message: 'The file could not be downloaded from the network.' },
		{ objectId: 'object-plan', severity: ExportReport_Issue_Severity.WARNING, code: 'undefined_property', message: 'A referenced property has no definition.' },
		{ objectId: 'object-missing', severity: ExportReport_Issue_Severity.ERROR, code: 'object_export_failed', message: 'The object could not be loaded.' },
	],
});

export const Partial: Story = { args: popupProps('exportResult', { report: partialReport, spaceId: 'export-space', path: '/exports' }) };
export const WarningsOnly: Story = {
	args: popupProps('exportResult', {
		report: ExportReport.fromPartial({
			status: ExportReport_Status.PARTIAL,
			succeed: 124,
			issues: [ partialReport.issues[1] ],
		}),
		spaceId: 'export-space',
		path: '/exports',
	}),
};
export const Failed: Story = { args: popupProps('exportResult', { report: ExportReport.fromPartial({ status: ExportReport_Status.FAILED, succeed: 3, issues: [ { severity: ExportReport_Issue_Severity.ERROR, code: 'export_failed', message: 'There is not enough free space on the destination disk.' } ] }), error: { code: 1 } }) };
export const Canceled: Story = { args: popupProps('exportResult', { report: ExportReport.fromPartial({ status: ExportReport_Status.CANCELED, succeed: 18 }), error: { code: 1 } }) };
export const NoReport: Story = { args: popupProps('exportResult', { error: { code: 1, description: 'The server connection was interrupted.' } }) };
export const ManyIssues: Story = { args: popupProps('exportResult', { report: { ...partialReport, issues: Array.from({ length: 125 }, (_, i) => ({ ...partialReport.issues[i % 3], path: `folder-${i}/file-${i}.jpg` })) }, spaceId: 'export-space', path: '/exports' }) };

export const TypeIdentityMismatch: Story = {
	args: popupProps('exportResult', {
		spaceId: 'export-space', exportType: 6,
		error: { code: 1, description: 'export by format: build path plan: ResolveProperties must provide a TypeResolver (SPEC §9)' },
		report: ExportReport.fromPartial({ status: ExportReport_Status.FAILED, issues: [ {
			objectId: 'typeid-test', severity: ExportReport_Issue_Severity.ERROR, code: 'type_identity_mismatch',
			message: 'export by format: build path plan: ResolveProperties must provide a TypeResolver (SPEC §9)',
		} ] }),
	}),
};

export const Informational: Story = {
	args: popupProps('exportResult', {
		path: '/exports', spaceId: 'export-space', exportType: 6,
		report: ExportReport.fromPartial({ status: ExportReport_Status.SUCCESS, succeed: 12, issues: [
			{ severity: ExportReport_Issue_Severity.INFO, code: 'unused_property', message: 'Unused property "syncStatus" was omitted from the dictionary' },
			{ objectId: 'option-test', severity: ExportReport_Issue_Severity.INFO, code: 'option_description_omitted', message: 'The option description is not included in this export format.' },
		] }),
	}),
};

export const WarningsAndNotes: Story = {
	args: popupProps('exportResult', {
		path: '/exports', spaceId: 'export-space', exportType: 6,
		report: ExportReport.fromPartial({ status: ExportReport_Status.SUCCESS, succeed: 124, issues: [
			partialReport.issues[1],
			...Informational.args.param.data.report.issues,
		] }),
	}),
};

export const UnresolvedReferences: Story = {
	args: popupProps('exportResult', {
		spaceId: 'export-space', path: '/exports',
		report: ExportReport.fromPartial({ succeed: 1, issues: [
			{ objectId: 'object-plan', severity: ExportReport_Issue_Severity.WARNING, code: 'unresolved_target', path: 'object-plan/blocks/link-block/object_id', message: 'Missing target in a link block.' },
			{ objectId: 'object-plan', severity: ExportReport_Issue_Severity.WARNING, code: 'unresolved_target', path: 'object-plan/properties/relatedProjects/1', message: 'Missing target in an object property.' },
		] }),
	}),
};
