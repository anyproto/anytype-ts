import storage from 'electron-json-storage';
import Util from './util';

const STORAGE_NAME = 'downloads';

// Bounded so a long-lived install cannot grow it without end. Oldest entries go
// first: the point of the ledger is to recognise a file downloaded recently
const MAX_ENTRIES = 500;

export interface LedgerEntry {
	path: string;
	size: number;
	mtimeMs: number;
	savedAt: number;
};

/**
 * Remembers where a downloaded file landed, so a later download of the same
 * object can recognise the copy already on disk instead of guessing at its
 * name. It is a cache, not an authority: the file's checksum is what proves
 * identity (see ./checksum), and a stale entry only costs a download.
 */
export class DownloadLedger {

	data: Record<string, LedgerEntry> = {};
	loaded: Promise<void> | null = null;

	key (objectId: string, directory: string): string {
		return `${objectId}|${directory}`;
	};

	load (): Promise<void> {
		if (!this.loaded) {
			this.loaded = new Promise<void>((resolve) => {
				storage.get(STORAGE_NAME, (err: Error | null, data: any) => {
					if (err) {
						Util.log('info', '[DownloadLedger] Cannot read:', err.toString());
					};

					this.data = (data && !Array.isArray(data)) ? data : {};
					resolve();
				});
			});
		};

		return this.loaded;
	};

	async get (objectId: string, directory: string): Promise<LedgerEntry | null> {
		await this.load();
		return this.data[this.key(objectId, directory)] || null;
	};

	async set (objectId: string, directory: string, entry: Omit<LedgerEntry, 'savedAt'>): Promise<void> {
		await this.load();

		this.data[this.key(objectId, directory)] = { ...entry, savedAt: Date.now() };
		this.prune();
		this.persist();
	};

	prune (): void {
		const keys = Object.keys(this.data);

		if (keys.length <= MAX_ENTRIES) {
			return;
		};

		keys
			.sort((a, b) => (this.data[a].savedAt || 0) - (this.data[b].savedAt || 0))
			.slice(0, keys.length - MAX_ENTRIES)
			.forEach(key => delete this.data[key]);
	};

	persist (): void {
		storage.set(STORAGE_NAME, this.data, (err: Error | null) => {
			if (err) {
				Util.log('info', '[DownloadLedger] Cannot write:', err.toString());
			};
		});
	};

};

export default new DownloadLedger();
