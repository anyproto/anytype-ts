import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExportReport, ExportReport_Status, ExportReport_Issue_Severity } from 'Proto/pkg/lib/pb/model/protos/export_report';
import * as I from 'Interface';

vi.mock('Lib/focus', () => ({ focus: {} }));
import Action from './action';

beforeEach(() => {
	vi.stubGlobal('C', { ObjectListExport: vi.fn() });
	vi.stubGlobal('S', { Popup: { open: vi.fn() } });
	vi.stubGlobal('translate', (key: string) => key);
	vi.stubGlobal('analytics', { event: vi.fn() });
	vi.spyOn(Action, 'openDirectoryDialog').mockImplementation((_param, callback) => callback([ '/exports' ]));
	vi.spyOn(Action, 'openPath').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

const complete = (message: any) => {
	Action.export('space', [ 'object' ], I.ExportType.AnyBlockV2, {});
	vi.mocked(C.ObjectListExport).mock.calls[0][9](message);
};

describe('export result popup', () => {
	it('opens the selected folder on clean success without showing a result popup', () => {
		complete({ error: { code: 0 } });
		expect(Action.openPath).toHaveBeenCalledWith('/exports');
		expect(S.Popup.open).not.toHaveBeenCalled();
	});

	it('opens the folder without a completed-with-issues popup for warnings alone', () => {
		complete({ report: ExportReport.fromPartial({ status: ExportReport_Status.PARTIAL, issues: [ { severity: ExportReport_Issue_Severity.WARNING, code: 'unresolved_target' } ] }), error: { code: 0 } });
		expect(Action.openPath).toHaveBeenCalledWith('/exports');
		expect(S.Popup.open).not.toHaveBeenCalled();
	});

	it('shows partial results with a folder action instead of immediately opening the folder', () => {
		const report = ExportReport.fromPartial({ fileErrors: 1 });
		complete({ report, path: '/exports/result.zip', error: { code: 0 } });
		expect(S.Popup.open).toHaveBeenCalledWith('exportResult', { data: expect.objectContaining({ report, path: '/exports', spaceId: 'space' }) });
		expect(Action.openPath).not.toHaveBeenCalled();
	});

	it('shows RPC failures without claiming that output is available', () => {
		complete({ error: { code: 1, description: 'Disk full' } });
		expect(S.Popup.open).toHaveBeenCalledWith('exportResult', { data: expect.objectContaining({ path: '', error: { code: 1, description: 'Disk full' } }) });
		expect(Action.openPath).not.toHaveBeenCalled();
	});

	it('does not record canceled exports as completed', () => {
		complete({ report: ExportReport.fromPartial({ status: ExportReport_Status.CANCELED }), error: { code: 0 } });
		expect(S.Popup.open).toHaveBeenCalled();
		expect(analytics.event).not.toHaveBeenCalled();
		expect(Action.openPath).not.toHaveBeenCalled();
	});
});
