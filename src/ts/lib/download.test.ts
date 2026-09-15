import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as I from 'Interface';
import Constant from 'json/constant';

const mocks = vi.hoisted(() => ({
	send: vi.fn(),
	analytics: vi.fn(),
	search: vi.fn(),
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

const records = (list: any[]) => mocks.search.mockImplementation((...args: any[]) => args[7]({ records: list }));

beforeEach(() => {
	rows = [];
	Download = new DownloadManager();
	records([]);

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
	vi.stubGlobal('C', { ObjectSearch: mocks.search });
	vi.stubGlobal('U', { File: { name: (it: any) => [ it.name, it.fileExt ].filter(v => v).join('.') } });
	// The real allowlist, so these tests move with the policy
	vi.stubGlobal('J', { Constant });
	vi.stubGlobal('analytics', { event: mocks.analytics });
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	mocks.send.mockReset();
	mocks.analytics.mockReset();
	mocks.search.mockReset();
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

	it('asks for what it takes to recognise a copy already on disk', () => {
		records([ { id: 'f1', name: 'one', fileExt: 'pdf', sizeInBytes: 1200, fileVariantChecksums: [ 'CHECKSUM1' ] } ]);

		Download.start([ files[0] ], '/tmp/downloads', 'Test');

		const keys = mocks.search.mock.calls[0][3];

		// Hidden relation: it does not travel with the default keys
		expect(keys).toContain('fileVariantChecksums');
		expect(keys).toContain('sizeInBytes');

		const request = mocks.send.mock.calls.find((it: any[]) => it[0] == 'download')[2];

		expect(request).toMatchObject({ objectId: 'f1', name: 'one.pdf', size: 1200, checksums: [ 'CHECKSUM1' ] });
	});

	it('downloads anyway when the lookup answers with nothing', () => {
		records([]);

		Download.start([ files[0] ], '/tmp/downloads', 'Test');

		const request = mocks.send.mock.calls.find((it: any[]) => it[0] == 'download')[2];

		// No identity to compare against: the transfer still has to happen
		expect(request).toMatchObject({ objectId: 'f1' });
		expect(request.checksums).toEqual([]);
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

	it('leaves no row behind when the file was opened or revealed', () => {
		const id = Download.start([ files[0] ], '/tmp/downloads', 'Test', { openWhenDone: true });

		Download.onDone({ id: partIds()[0], path: '/tmp/downloads/one.pdf' });

		// Something already happened with the file — it opened, or its folder came
		// up — so a row offering to reveal it again is noise
		expect(row(id).keepWhenDone).toBe(false);
		expect(Download.getParts(id)).toEqual([]);
	});

	it('keeps the row of a plain save, which did nothing but write the file', () => {
		const id = Download.start([ files[0] ], '/tmp/downloads', 'Test');

		Download.onDone({ id: partIds()[0], path: '/tmp/downloads/one.pdf' });

		expect(row(id).keepWhenDone).toBe(true);
		expect(Download.getParts(id).length).toBe(1);
	});

	it('keeps a failed open around, since nothing was opened to speak for it', () => {
		const id = Download.start([ files[0] ], '/tmp/downloads', 'Test', { openWhenDone: true });

		Download.onDone({ id: partIds()[0], error: 'Disk full' });

		expect(row(id)).toMatchObject({ state: I.ProgressState.Error, error: 'Disk full' });
		expect(Download.getParts(id).map(it => it.error)).toEqual([ 'Disk full' ]);
	});

	it('keeps a finished row around, since it stays on screen until dismissed', () => {
		const failed = Download.start([ files[0] ], '/tmp/downloads', 'Test');

		Download.onDone({ id: partIds()[0], error: 'Disk full' });

		expect(Download.getParts(failed).map(it => it.error)).toEqual([ 'Disk full' ]);

		mocks.send.mockReset();

		const succeeded = Download.start([ files[1] ], '/tmp/downloads', 'Test');

		Download.onDone({ id: partIds()[0], path: '/tmp/downloads/two.png' });

		// Both rows stay: a finished one offers to reveal the file, a failed one
		// shows why. Only dismissing drops them
		expect(Download.getParts(succeeded).length).toBe(1);

		Download.drop(succeeded);

		expect(Download.getParts(succeeded)).toEqual([]);
	});

	it('reveals the file itself for a single download', () => {
		const id = Download.start([ files[0] ], '/tmp/downloads', 'Test');

		Download.onDone({ id: partIds()[0], path: '/tmp/downloads/one.pdf' });
		mocks.send.mockReset();

		Download.reveal(id);

		expect(mocks.send).toHaveBeenCalledWith('showInFolder', '/tmp/downloads/one.pdf');
	});

	it('reveals the folder for a batch, where no single file is the answer', () => {
		const id = Download.start(files, '/tmp/downloads', 'Test');

		partIds().forEach((it, i) => Download.onDone({ id: it, path: `/tmp/downloads/file${i}` }));
		mocks.send.mockReset();

		Download.reveal(id);

		expect(mocks.send).toHaveBeenCalledWith('openPath', '/tmp/downloads');
	});

	it('hands a file the system can view to the OS handler', () => {
		Download.start([ files[0] ], '/downloads', 'Test', { openWhenDone: true });

		Download.onDone({ id: partIds()[0], path: '/downloads/one.pdf' });

		expect(mocks.send).toHaveBeenCalledWith('openPath', '/downloads/one.pdf');

		// Reported on the open, the way it was before the file went through the
		// gateway: a download that never landed opened nothing
		expect(mocks.analytics).toHaveBeenCalledWith('OpenMedia', { route: 'Test' });
	});

	it('reveals an archive instead of opening it, which would extract it', () => {
		Download.start([ files[0] ], '/downloads', 'Test', { openWhenDone: true });

		Download.onDone({ id: partIds()[0], path: '/downloads/x86_64-linux-musl.tgz' });

		expect(mocks.send).toHaveBeenCalledWith('showInFolder', '/downloads/x86_64-linux-musl.tgz');
		expect(mocks.send).not.toHaveBeenCalledWith('openPath', expect.anything());
	});

	it('reveals anything the allowlist does not name, extensionless files included', () => {
		for (const name of [ 'installer.dmg', 'script.sh', 'notes', 'page.html' ]) {
			mocks.send.mockReset();

			Download.start([ files[0] ], '/downloads', 'Test', { openWhenDone: true });
			Download.onDone({ id: partIds()[0], path: `/downloads/${name}` });

			expect(mocks.send).toHaveBeenCalledWith('showInFolder', `/downloads/${name}`);
			expect(mocks.send).not.toHaveBeenCalledWith('openPath', expect.anything());
		};
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
