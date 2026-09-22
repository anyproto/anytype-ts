import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { download } from 'electron-dl';
import WindowManager from './window';
import Ledger from './downloadLedger';
import { fileChecksums } from './checksum';
import Util from './util';
import { AppWindow } from './types';

export interface DownloadRequest {
	id: string;
	url: string;
	directory: string;
	// Identity of what is being fetched, used to recognise a copy already on
	// disk. Absent for untracked transfers, which always download
	objectId?: string;
	name?: string;
	size?: number;
	checksums?: string[];
	// A file being opened rather than saved: main picks where it goes, and it
	// replaces itself there instead of landing beside the last copy
	temporary?: boolean;
};

interface ExistingFile {
	path: string;
	size: number;
};

const statOrNull = (filePath: string): fs.Stats | null => {
	try {
		const stat = fs.statSync(filePath);
		return stat.isFile() ? stat : null;
	} catch (e) {
		return null;
	};
};

/**
 * Where opened files live: a scope of our own inside the system temp directory,
 * a folder per object.
 */
export const openedRoot = (): string => path.join(app.getPath('temp'), 'anytype', 'open');

// How long a folder there is kept once nothing has landed in it. macOS purges
// its own temp scope; Windows and Linux leave it to whoever filled it
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

interface QueueEntry {
	win: AppWindow;
	param: DownloadRequest;
};

/**
 * Runs file downloads through the native Electron stack, one at a time.
 *
 * The serialization is not a nicety: electron-dl attaches its own
 * will-download listener per call, so concurrent downloads see each other's
 * items and report each other's bytes. Queuing also keeps a large batch from
 * filling the gateway's shared request budget and stalling image rendering.
 *
 * Every transfer is identified by a caller-chosen id. Progress and the single
 * terminal event are broadcast to all tabs: only the renderer holding that id
 * has a row to update, and broadcasting keeps it working when the user switches
 * tabs mid-download.
 */
export class DownloadManager {

	items = new Map<string, Electron.DownloadItem>();
	queue: QueueEntry[] = [];
	active: string = '';

	start (win: AppWindow, param: DownloadRequest): void {
		this.queue.push({ win, param: { ...param, directory: this.directory(param) } });
		this.next();
	};

	/**
	 * Where a transfer should land.
	 *
	 * A file being opened gets a folder of its own under the temp scope, so its
	 * path is the same on every open and the copy already there is recognised.
	 * A fresh folder each time would leave another copy behind for every open.
	 * Everything else keeps the folder the caller chose.
	 */
	directory (param: DownloadRequest): string {
		return (param.temporary && param.objectId) ? path.join(openedRoot(), param.objectId) : param.directory;
	};

	/**
	 * Drops the folders of files opened long enough ago that holding them costs
	 * more than fetching them again. A folder's mtime is when a file last landed
	 * in it, which is the age of the copy it holds.
	 */
	prune (): void {
		const root = openedRoot();

		let names: string[] = [];

		try {
			names = fs.readdirSync(root);
		} catch (e) {
			return;
		};

		names.forEach(name => {
			const dir = path.join(root, name);

			try {
				const stat = fs.statSync(dir);

				if (stat.isDirectory() && ((Date.now() - stat.mtimeMs) > MAX_AGE)) {
					fs.rmSync(dir, { recursive: true, force: true });
				};
			} catch (e: any) {
				Util.log('info', '[Download] Cannot sweep:', dir, e.toString());
			};
		});
	};

	/**
	 * Cancels a transfer whether it is running or still waiting its turn. A
	 * running one reports itself through electron-dl's onCancel; a queued one
	 * has nothing to report it, so it is answered here.
	 */
	cancel (id: string): void {
		const item = this.items.get(id);

		if (item) {
			item.cancel();
			return;
		};

		const index = this.queue.findIndex(it => it.param.id == id);

		if (index >= 0) {
			this.queue.splice(index, 1);
			this.send('file-download-done', { id, isCancelled: true });
		};
	};

	send (channel: string, payload: any): void {
		WindowManager.sendToAllTabs(channel, payload);
	};

	next (): void {
		if (this.active || !this.queue.length) {
			return;
		};

		const entry = this.queue.shift();

		this.active = entry.param.id;
		void this.run(entry.win, entry.param);
	};

	async run (win: AppWindow, param: DownloadRequest): Promise<void> {
		const { id, url, directory, temporary } = param;

		let finished = false;

		const done = (payload: any) => {
			finished = true;
			this.send('file-download-done', payload);
		};

		try {
			const existing = await this.existing(param);

			if (existing) {
				Util.log('info', '[Download] The file is already on disk, reusing it');

				// Fills the row the way a finished transfer would, so the caller
				// needs to know nothing about the shortcut
				this.send('file-download-progress', { id, current: existing.size, total: existing.size, name: path.basename(existing.path) });
				done({ id, path: existing.path });
				return;
			};

			// electron-dl only joins the path; a folder of our own will not exist yet
			if (directory) {
				fs.mkdirSync(directory, { recursive: true });
			};

			await download(win, url, {
				directory,
				// A temporary copy replaces itself: its path has to stay the same,
				// or the uniquifier leaves a "file (1)" behind on every open
				overwrite: Boolean(temporary),
				onStarted: (item: Electron.DownloadItem) => {
					this.items.set(id, item);

					// The name the file will actually be saved under: the stack
					// resolves it from Content-Disposition and uniquifies it
					this.send('file-download-progress', { id, current: 0, total: item.getTotalBytes(), name: item.getFilename() });
				},
				onProgress: ({ transferredBytes, totalBytes }) => {
					this.send('file-download-progress', { id, current: transferredBytes, total: totalBytes });
				},
				onCancel: () => done({ id, isCancelled: true }),
				onCompleted: (file: any) => {
					this.record(param, file.path);
					done({ id, path: file.path });
				},
			});
		} catch (err: any) {
			// A cancel rejects too, and has already reported itself
			if (!finished) {
				Util.log('error', '[Download] Transfer failed:', err.toString());
				done({ id, error: err.message || String(err) });
			};
		} finally {
			this.items.delete(id);
			this.active = '';
			this.next();
		};
	};

	/**
	 * The copy already on disk, when there is one worth reusing.
	 *
	 * The ledger says where we put the file last time, and its recorded size and
	 * mtime are a cheap way to see it has not been touched since. Anything else —
	 * a touched file, or a candidate we never wrote — is decided by content: a
	 * checksum matching one the middleware stored proves the bytes are this
	 * object's own, which no name or size comparison can.
	 */
	async existing (param: DownloadRequest): Promise<ExistingFile | null> {
		const { objectId, directory, name, size, checksums } = param;

		if (!objectId || !directory) {
			return null;
		};

		const entry = await Ledger.get(objectId, directory);
		const candidates: { path: string; isOurs: boolean }[] = [];

		if (entry?.path) {
			candidates.push({ path: entry.path, isOurs: true });
		};

		// A file the user already had, or one we wrote before this ledger existed
		if (name) {
			const guess = path.join(directory, name);

			if (!candidates.some(it => it.path == guess)) {
				candidates.push({ path: guess, isOurs: false });
			};
		};

		for (const candidate of candidates) {
			const stat = statOrNull(candidate.path);

			if (!stat) {
				continue;
			};

			if (candidate.isOurs && entry && (stat.size == entry.size) && (stat.mtimeMs == entry.mtimeMs)) {
				return { path: candidate.path, size: stat.size };
			};

			if (!checksums?.length) {
				continue;
			};

			// Cheap reject before hashing, but only for a file we cannot vouch for:
			// a variant we served may not weigh what the object reports
			if (!candidate.isOurs && size && (stat.size != size)) {
				continue;
			};

			const local = await fileChecksums(candidate.path);

			if (local.some(it => checksums.includes(it))) {
				await Ledger.set(objectId, directory, { path: candidate.path, size: stat.size, mtimeMs: stat.mtimeMs });
				return { path: candidate.path, size: stat.size };
			};
		};

		return null;
	};

	/**
	 * Notes where a transfer landed, so the next one for the same object costs a
	 * stat rather than a hash.
	 */
	record (param: DownloadRequest, filePath: string): void {
		const { objectId, directory } = param;
		const stat = objectId && filePath ? statOrNull(filePath) : null;

		if (!stat) {
			return;
		};

		void Ledger.set(objectId, directory, { path: filePath, size: stat.size, mtimeMs: stat.mtimeMs });
	};

};

export default new DownloadManager();
