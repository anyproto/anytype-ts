import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExportReport, ExportReport_Status } from 'Proto/pkg/lib/pb/model/protos/export_report';

vi.mock('./service', () => ({ ServiceClient: class {} }));
vi.mock('./grpc-devtools', () => ({ unaryInterceptors: [], streamInterceptors: [] }));
vi.mock('Model', () => ({}));

import { dispatcher } from './dispatcher';
import { Mapper } from './mapper';

beforeEach(() => {
	vi.stubGlobal('S', { Common: { config: { flagsMw: {} } }, Auth: { token: '' } });
	vi.stubGlobal('U', { Common: { translateError: (_type: string, error: any) => error.description } });
	vi.stubGlobal('analytics', { event: vi.fn() });
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	dispatcher.service = null;
});

describe('export RPC diagnostics', () => {
	it('preserves full source paths through report serialization', () => {
		const report = ExportReport.fromPartial({ issues: [
			{ objectId: 'source', code: 'unresolved_target', path: 'source/blocks/link-block/object_id', message: 'Missing target' },
			{ objectId: 'source', code: 'unresolved_target', path: 'source/properties/relatedProjects/1', message: 'Missing target' },
		] });
		expect(ExportReport.decode(ExportReport.encode(report).finish())).toEqual(report);
	});

	it('preserves the selected folder when mapping an export notification', () => {
		const report = ExportReport.fromPartial({ succeed: 12 });
		const notification = { space: 'space', isLocal: true, export: { path: '/exports', report } };
		expect(Mapper.From.Notification(notification).payload).toEqual(expect.objectContaining({ path: '/exports', report, spaceId: 'space' }));
	});

	it.each([ 'ObjectListExport', 'ObjectExport' ])('preserves a report when %s returns an error', command => {
		const report = ExportReport.fromPartial({ status: ExportReport_Status.FAILED, succeed: 3, fileErrors: 1, issues: [ { message: 'Disk full' } ] });
		dispatcher.service = { request: (_type, _data, _metadata, callback) => callback(null, { report, error: { code: 1, description: 'Disk full' } }) } as any;
		const done = vi.fn();
		dispatcher.request(command, {}, done);
		expect(done).toHaveBeenCalledWith(expect.objectContaining({ report, error: { code: 1, description: 'Disk full' } }));
	});

	it('preserves output path, counts, and warnings on a completed partial export', () => {
		const report = ExportReport.fromPartial({ status: ExportReport_Status.PARTIAL, succeed: 4, issues: [ { message: 'Property omitted' } ] });
		dispatcher.service = { request: (_type, _data, _metadata, callback) => callback(null, { report, path: '/export/result.zip', succeed: 4, error: { code: 0 } }) } as any;
		const done = vi.fn();
		dispatcher.request('ObjectListExport', {}, done);
		expect(done).toHaveBeenCalledWith(expect.objectContaining({ report, path: '/export/result.zip', succeed: 4 }));
	});
});
