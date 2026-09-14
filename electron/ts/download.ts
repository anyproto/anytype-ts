import { download } from 'electron-dl';
import WindowManager from './window';
import Util from './util';
import { AppWindow } from './types';

export interface DownloadRequest {
	id: string;
	url: string;
	directory: string;
};

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
		this.queue.push({ win, param });
		this.next();
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
		const { id, url, directory } = param;

		let finished = false;

		const done = (payload: any) => {
			finished = true;
			this.send('file-download-done', payload);
		};

		try {
			await download(win, url, {
				directory,
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
				onCompleted: (file: any) => done({ id, path: file.path }),
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

};

export default new DownloadManager();
