import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExportReport, ExportReport_Status, ExportReport_Issue_Severity } from 'Proto/pkg/lib/pb/model/protos/export_report';
import { getExportResultStatus, getExportIssueMessageKey } from './exportReport';
import { loadExportReportObjects } from './exportReportObjects';
import * as I from 'Interface';
import relation from 'json/relation';

afterEach(() => vi.unstubAllGlobals());

describe('export report status', () => {
	it('keeps successful exports compatible with older servers without a report', () => {
		expect(getExportResultStatus()).toBe('Success');
		expect(getExportResultStatus(undefined, 1)).toBe('Failed');
	});

	it('surfaces errors and missing files even if the RPC succeeds', () => {
		expect(getExportResultStatus(ExportReport.fromPartial({ issues: [ { severity: ExportReport_Issue_Severity.ERROR, message: 'An object was omitted' } ] }))).toBe('Partial');
		expect(getExportResultStatus(ExportReport.fromPartial({ fileErrors: 1 }))).toBe('Partial');
		expect(getExportResultStatus(ExportReport.fromPartial({ objectErrors: 1 }))).toBe('Partial');
	});

	it('keeps informational notes and warnings successful, including older partial reports', () => {
		const report = ExportReport.fromPartial({ issues: [ { code: 'unused_property', severity: ExportReport_Issue_Severity.INFO } ] });
		expect(getExportResultStatus(report)).toBe('Success');
		report.issues.push(ExportReport.fromPartial({ issues: [ { severity: ExportReport_Issue_Severity.WARNING } ] }).issues[0]);
		report.status = ExportReport_Status.PARTIAL;
		expect(getExportResultStatus(report)).toBe('Success');
	});

	it('preserves cancellation when it is also reported as an RPC error', () => {
		expect(getExportResultStatus({ status: ExportReport_Status.CANCELED }, 1)).toBe('Canceled');
	});

	it('preserves fatal failures and derives partial status only from errors', () => {
		expect(getExportResultStatus({ status: ExportReport_Status.PARTIAL }, 1)).toBe('Failed');
		expect(getExportResultStatus({ status: ExportReport_Status.FAILED })).toBe('Failed');
		expect(getExportResultStatus({ status: ExportReport_Status.UNRECOGNIZED })).toBe('Success');
	});
});

describe('export report object lookup', () => {
	const setup = () => {
		const search = vi.fn();
		vi.stubGlobal('C', { ObjectSearch: search });
		vi.stubGlobal('J', { Relation: relation });
		vi.stubGlobal('S', { Detail: { mapper: (object: any) => ({ ...object, type: object.type?.[0] || '' }) } });
		return search;
	};

	it('requests every unique issue object, including those beyond the first visible page, with name/type/icon keys', () => {
		const search = setup();
		const ids = Array.from({ length: 75 }, (_, i) => `object-${i}`);
		const report = ExportReport.fromPartial({ issues: [ ...ids, ids[0], '' ].map(objectId => ({ objectId })) });
		loadExportReportObjects('export-space', report, vi.fn());
		expect(search).toHaveBeenCalledWith('export-space', [ { relationKey: 'id', condition: I.FilterCondition.In, value: ids }, { relationKey: 'isArchived', condition: I.FilterCondition.None, value: null } ], [],
			expect.arrayContaining([ 'name', 'type', 'layout', 'iconEmoji', 'iconImage', 'iconName', 'iconOption' ]), '', 0, 75, expect.any(Function));
	});

	it('fetches type objects from the same space and preserves missing-object diagnostics', () => {
		const search = setup();
		const done = vi.fn();
		loadExportReportObjects('export-space', ExportReport.fromPartial({ issues: [ { objectId: 'found' }, { objectId: 'missing' } ] }), done);
		search.mock.calls[0][7]({ records: [ { id: 'found', name: 'Plan', iconEmoji: '📋', type: [ 'type-page' ] } ] });
		expect(search.mock.calls[1][0]).toBe('export-space');
		expect(search.mock.calls[1][1][0].value).toEqual([ 'type-page' ]);
		search.mock.calls[1][7]({ records: [ { id: 'type-page', name: 'Page' } ] });
		expect(done).toHaveBeenCalledWith({ found: expect.objectContaining({ name: 'Plan', iconEmoji: '📋', type: 'type-page' }), 'type-page': expect.objectContaining({ name: 'Page' }) });
	});

	it('ignores a late response after the popup closes', () => {
		const search = setup();
		const done = vi.fn();
		const cancel = loadExportReportObjects('space', ExportReport.fromPartial({ issues: [ { objectId: 'object' } ] }), done);
		cancel();
		search.mock.calls[0][7]({ records: [ { id: 'object' } ] });
		expect(done).not.toHaveBeenCalled();
	});
});

describe('export issue messages', () => {
	it('uses stable codes for translated failures without parsing diagnostic text', () => {
		expect(getExportIssueMessageKey({ code: 'type_identity_mismatch' })).toBe('popupExportResultTypeIdentityMismatch');
		expect(getExportIssueMessageKey({ code: 'export_failed' })).toBe('popupExportResultExportFailed');
		expect(getExportIssueMessageKey({ code: 'unresolved_target' })).toBe('popupExportResultUnresolvedTarget');
		expect(getExportIssueMessageKey({ code: 'future_code' })).toBe('');
		expect(getExportIssueMessageKey({ code: '' })).toBe('');
	});
});
