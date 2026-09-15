import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as I from 'Interface';

const mocks = vi.hoisted(() => ({
	send: vi.fn(),
	analytics: vi.fn(),
}));

vi.mock('Lib/renderer', () => ({ default: { send: mocks.send } }));

import { Download as DownloadManager } from './download';

const files = [
	{ id: 'f1' },
	{ id: 'f2' },
	{ id: 'f3' },
];

let rows: any[] = [];
let Download: DownloadManager;

const row = (id: string) => rows.find(it => it.id == id);

// The ids the renderer handed to main, in start order
const partIds = (): string[] => mocks.send.mock.calls.filter((it: any[]) => it[0] == 'download').map((it: any[]) => it[2].id);

const percent = (id: string): number => {
	const it = row(id);
	return it.total ? Math.round(it.current / it.total * 100) : 0;
};

beforeEach(() => {
	rows = [];
	Download = new DownloadManager();

	vi.stubGlobal('S', {
		Progress: {
			add: (item: any) => rows.push({ ...item }),
			update: (param: any) => {
				const item = row(param.id);
				item ? Object.assign(item, param) : rows.push({ ...param });
			},
		},
		Common: {
			fileUrl: (id: string) => `http://gateway/file/${id}`,
			imageUrl: (id: string) => `http://gateway/image/${id}?width=0`,
			downloadStart: vi.fn(),
			downloadDone: vi.fn(),
		},
	});
	vi.stubGlobal('translate', (key: string) => key);
	vi.stubGlobal('analytics', { event: mocks.analytics });
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	mocks.send.mockReset();
	mocks.analytics.mockReset();
});

describe('client-owned downloads', () => {
	it('opens one cancellable row for a whole selection', () => {
		const id = Download.start(files, '/tmp/downloads', 'Test');

		expect(rows.length).toBe(1);
		expect(row(id)).toMatchObject({ type: I.ProgressType.Save, state: I.ProgressState.Running, canCancel: true, isLocal: true });
		expect(partIds().length).toBe(3);
	});

	it('combines per-file progress into the row, each file weighing the same', () => {
		const id = Download.start(files, '/tmp/downloads', 'Test');
		const [ first, second ] = partIds();

		Download.onProgress({ id: first, current: 50, total: 100 });

		// Half of one file out of three
		expect(percent(id)).toBe(17);

		Download.onDone({ id: first, path: '/tmp/downloads/one.pdf' });
		Download.onProgress({ id: second, current: 25, total: 100 });

		expect(percent(id)).toBe(42);
	});

	it('keeps each file its own name and progress for the hover detail', () => {
		const id = Download.start(files, '/tmp/downloads', 'Test');
		const [ first, second ] = partIds();

		Download.onProgress({ id: first, current: 0, total: 100, name: 'one.pdf' });
		Download.onProgress({ id: first, current: 40, total: 100 });
		Download.onDone({ id: first, path: '/tmp/downloads/one.pdf' });
		Download.onProgress({ id: second, current: 10, total: 50, name: 'two.png' });

		expect(Download.getParts(id).map(it => [ it.name, it.percent ])).toEqual([
			[ 'one.pdf', 100 ],
			[ 'two.png', 20 ],
			// Still queued: the stack has not told us what it will be saved as
			[ '', 0 ],
		]);
	});

	it('lists one line per file for the row tooltip', () => {
		const id = Download.start(files, '/tmp/downloads', 'Test');
		const [ first, second, third ] = partIds();

		Download.onProgress({ id: first, current: 0, total: 100, name: 'one.pdf' });
		Download.onDone({ id: first, path: '/tmp/downloads/one.pdf' });
		Download.onProgress({ id: second, current: 30, total: 100, name: 'two.png' });
		Download.onDone({ id: third, error: 'Disk full' });

		expect(Download.tooltip(id).split('\n')).toEqual([
			'one.pdf · 100%',
			'two.png · 30%',
			'Disk full',
		]);
	});

	it('saves the original file, never a resized image variant', () => {
		Download.start(files, '/tmp/downloads', 'Test');

		const urls = mocks.send.mock.calls.filter((it: any[]) => it[0] == 'download').map((it: any[]) => it[1]);

		// /image/ resizes: width=0 answers with the smallest variant, not the
		// original. /file/ is the only endpoint that returns what was uploaded
		expect(urls).toEqual([
			'http://gateway/file/f1?attachment=1',
			'http://gateway/file/f2?attachment=1',
			'http://gateway/file/f3?attachment=1',
		]);
	});

	it('names the file the row is working on right now', () => {
		const id = Download.start(files, '/tmp/downloads', 'Test');
		const [ first, second ] = partIds();

		Download.onProgress({ id: first, current: 0, total: 100, name: 'one.pdf' });

		expect(Download.activeName(id)).toBe('one.pdf');

		Download.onDone({ id: first, path: '/tmp/downloads/one.pdf' });
		Download.onProgress({ id: second, current: 0, total: 100, name: 'two.png' });

		expect(Download.activeName(id)).toBe('two.png');
	});

	it('reports bytes, not files, when a single file is downloading', () => {
		const id = Download.start([ files[0] ], '/tmp/downloads', 'Test');

		Download.onProgress({ id: partIds()[0], current: 300, total: 1200 });

		expect(percent(id)).toBe(25);
	});

	it('closes the row once every file has settled', () => {
		const id = Download.start(files, '/tmp/downloads', 'Test');

		partIds().forEach(it => Download.onDone({ id: it, path: `/tmp/downloads/${it}` }));

		expect(row(id).state).toBe(I.ProgressState.Done);
	});

	it('cancels every file in the row, including the ones still queued', () => {
		const id = Download.start(files, '/tmp/downloads', 'Test');
		const ids = partIds();

		Download.cancel(id);

		const cancelled = mocks.send.mock.calls.filter((it: any[]) => it[0] == 'downloadCancel').map((it: any[]) => it[1]);

		expect(cancelled).toEqual(ids);
		expect(row(id).state).toBe(I.ProgressState.Canceled);
	});

	it('fails the row with a reason when a file fails, after the rest have run', () => {
		const id = Download.start(files, '/tmp/downloads', 'Test');
		const ids = partIds();

		Download.onDone({ id: ids[0], error: 'Disk full' });

		// The other two are still going: the row must not close early
		expect(row(id).state).toBe(I.ProgressState.Running);

		Download.onDone({ id: ids[1], path: '/tmp/downloads/two.png' });
		Download.onDone({ id: ids[2], path: '/tmp/downloads/three.txt' });

		expect(row(id)).toMatchObject({ state: I.ProgressState.Error, error: 'Disk full' });
	});

	it('ignores progress that arrives after a download has settled', () => {
		const id = Download.start([ files[0] ], '/tmp/downloads', 'Test');
		const [ first ] = partIds();

		Download.onProgress({ id: first, current: 1200, total: 1200 });
		Download.onDone({ id: first, path: '/tmp/downloads/one.pdf' });

		const settled = { state: row(id).state, current: row(id).current };

		Download.onProgress({ id: first, current: 10, total: 1200 });

		expect(row(id)).toMatchObject(settled);
	});

	it('keeps the per-file detail of a failed row, and only of a failed one', () => {
		const failed = Download.start([ files[0] ], '/tmp/downloads', 'Test');

		Download.onDone({ id: partIds()[0], error: 'Disk full' });

		// The failed row stays in the sidebar, so its hover detail has to survive
		expect(Download.getParts(failed).map(it => it.error)).toEqual([ 'Disk full' ]);

		mocks.send.mockReset();

		const succeeded = Download.start([ files[1] ], '/tmp/downloads', 'Test');

		Download.onDone({ id: partIds()[0], path: '/tmp/downloads/two.png' });

		// A finished row vanishes from the sidebar: nothing left to hover
		expect(Download.getParts(succeeded)).toEqual([]);
	});

	it('hands a file to the OS handler when the row was opened, not saved', () => {
		Download.start([ files[0] ], '/downloads', 'Test', { openWhenDone: true });

		Download.onDone({ id: partIds()[0], path: '/downloads/one.pdf' });

		expect(mocks.send).toHaveBeenCalledWith('openPath', '/downloads/one.pdf');

		// Reported on the open, the way it was before the file went through the
		// gateway: a download that never landed opened nothing
		expect(mocks.analytics).toHaveBeenCalledWith('OpenMedia', { route: 'Test' });
	});

	it('opens nothing for a plain save, and reports it as a download', () => {
		Download.start([ files[0] ], '/downloads', 'Test');

		Download.onDone({ id: partIds()[0], path: '/downloads/one.pdf' });

		expect(mocks.send).not.toHaveBeenCalledWith('openPath', expect.anything());
		expect(mocks.analytics).toHaveBeenCalledWith('DownloadMedia', { route: 'Test' });
	});

	it('opens nothing when the file never landed', () => {
		Download.start([ files[0] ], '/downloads', 'Test', { openWhenDone: true });

		Download.onDone({ id: partIds()[0], error: 'Disk full' });

		expect(mocks.send).not.toHaveBeenCalledWith('openPath', expect.anything());
		expect(mocks.analytics).not.toHaveBeenCalledWith('OpenMedia', expect.anything());
	});

	it('ignores events for downloads another window owns', () => {
		Download.start([ files[0] ], '/tmp/downloads', 'Test');

		expect(() => Download.onProgress({ id: 'someone-elses', current: 1, total: 2 })).not.toThrow();
		expect(() => Download.onDone({ id: 'someone-elses', path: '/tmp/x' })).not.toThrow();
	});
});
