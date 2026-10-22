import { describe, it, expect, vi, afterEach } from 'vitest';
import UtilCommon from './common';

/**
 * Files without a disk path (pasted, dragged from a browser) are written to temp before upload.
 * Heart names the uploaded object after the file name in that path, so it must stay the original
 * name, while files with the same name must still land on different paths.
 */
describe('UtilCommon.saveClipboardFiles', () => {

	class FakeReader {
		result: any = null;
		onload: () => void = () => {};
		onerror: () => void = () => {};

		readAsBinaryString (blob: any) {
			this.result = blob.content;
			setTimeout(() => this.onload(), 0);
		};
	};

	const electron = (window as any).Electron;
	const save = (items: any[]): Promise<any[]> => new Promise(resolve => UtilCommon.saveClipboardFiles(items, {}, data => resolve(data.files)));

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		delete electron.fileWrite;
	});

	it('writes same-named files into separate unique paths keeping the name', async () => {
		let n = 0;
		const fileWrite = vi.fn((name: string) => `/tmp/anytype-${++n}/${name}`);

		vi.stubGlobal('FileReader', FakeReader);
		electron.fileWrite = fileWrite;

		const files = await save([
			{ name: 'image.png', file: { content: 'first' } },
			{ name: 'image.png', file: { content: 'second' } },
		]);

		expect(fileWrite.mock.calls).toEqual([
			[ 'image.png', 'first', { encoding: 'binary', unique: true } ],
			[ 'image.png', 'second', { encoding: 'binary', unique: true } ],
		]);
		expect(files.map(it => it.path)).toEqual([ '/tmp/anytype-1/image.png', '/tmp/anytype-2/image.png' ]);
	});

	it('passes files that already have a path through unchanged', async () => {
		const fileWrite = vi.fn();
		const item = { name: 'photo.jpg', path: '/Users/me/photo.jpg' };

		electron.fileWrite = fileWrite;

		const files = await save([ item ]);

		expect(files).toEqual([ item ]);
		expect(fileWrite).not.toHaveBeenCalled();
	});

	it('still completes when one file cannot be written', async () => {
		vi.stubGlobal('FileReader', FakeReader);
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		electron.fileWrite = vi.fn((name: string) => {
			if (name == 'broken.png') {
				throw new Error('ENOSPC');
			};
			return `/tmp/anytype-1/${name}`;
		});

		const files = await save([
			{ name: 'broken.png', file: { content: 'a' } },
			{ name: 'ok.png', file: { content: 'b' } },
		]);

		expect(files.map(it => it.path)).toEqual([ '/tmp/anytype-1/ok.png' ]);
	});

});
