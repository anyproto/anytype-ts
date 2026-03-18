import { app } from 'electron';
import fs from 'fs';
import path from 'path';

class SafeStorage {

	filePath: string;
	tmpPath: string;
	bakPath: string;
	data: Record<string, any>;

	constructor (filePath: string) {
		this.filePath = filePath;
		this.tmpPath = filePath + '.tmp';
		this.bakPath = filePath + '.bak';
		this.data = this._load();
	};

	_load (): Record<string, any> {
		// Check for orphaned temp file (process died during _writeAtomic after fsync but before rename)
		if (fs.existsSync(this.tmpPath)) {
			const tmp = this._readJson(this.tmpPath);

			if (tmp !== null) {
				console.log('[SafeStorage] Recovered from interrupted write:', this.tmpPath);

				try {
					fs.renameSync(this.tmpPath, this.filePath);
					return tmp;
				} catch (e: any) {
					console.error('[SafeStorage] Failed to recover from temp file:', e.message);
				};
			} else {
				// Temp file is corrupt (incomplete write), remove it
				try {
					fs.unlinkSync(this.tmpPath);
				} catch (e) {};
			};
		};

		// Try main file first
		const main = this._readJson(this.filePath);
		if (main !== null) {
			return main;
		};

		// Main file missing or corrupt — try backup
		const backup = this._readJson(this.bakPath);
		if (backup !== null) {
			console.log('[SafeStorage] Recovered from backup:', this.bakPath);

			// Restore backup as main file
			try {
				this._writeAtomic(backup);
			} catch (e: any) {
				console.error('[SafeStorage] Failed to restore backup to main file:', e.message);
			};

			return backup;
		};

		// Both missing or corrupt — start fresh
		return {};
	};

	_readJson (fp: string): Record<string, any> | null {
		try {
			const raw = fs.readFileSync(fp, 'utf8');
			return JSON.parse(raw);
		} catch (e) {
			return null;
		};
	};

	_save () {
		try {
			this._writeAtomic(this.data);
		} catch (e: any) {
			console.error('[SafeStorage] Failed to save:', e.message);
		};
	};

	_writeAtomic (data: Record<string, any>) {
		const json = JSON.stringify(data, null, '\t');

		// Write to temp file and fsync
		const fd = fs.openSync(this.tmpPath, 'w');
		fs.writeSync(fd, json, 0, 'utf8');
		fs.fsyncSync(fd);
		fs.closeSync(fd);

		// Copy current file to backup (if it exists)
		if (fs.existsSync(this.filePath)) {
			try {
				fs.copyFileSync(this.filePath, this.bakPath);
			} catch (e: any) {
				console.error('[SafeStorage] Failed to create backup:', e.message);
			};
		};

		// Rename temp to main (atomic on most filesystems)
		fs.renameSync(this.tmpPath, this.filePath);
	};

	get (key?: string) {
		if (key === undefined) {
			return { ...this.data };
		};

		return this.data[key];
	};

	set (key: string | Record<string, any>, value?: any) {
		if ((typeof key === 'object') && (value === undefined)) {
			Object.assign(this.data, key);
		} else {
			this.data[key as string] = value;
		};

		this._save();
	};

	delete (key: string) {
		delete this.data[key];
		this._save();
	};

	clear () {
		this.data = {};
		this._save();
	};

	get store () {
		return { ...this.data };
	};

};

let instance: SafeStorage | null = null;

export function getSafeStorage (): SafeStorage {
	if (!instance) {
		const suffix = app.isPackaged ? '' : 'dev';
		const name = [ 'localStorage', suffix ].join('-') + '.json';
		const filePath = path.join(app.getPath('userData'), name);

		instance = new SafeStorage(filePath);
	};

	return instance;
};

export { SafeStorage };
