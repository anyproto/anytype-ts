import * as I from 'Interface';
import Renderer from 'Lib/renderer';

export interface DownloadFile {
	id: string;
};

export interface DownloadPart {
	id: string;
	fileId: string;
	name: string;
	current: number;
	total: number;
	percent: number;
	state: I.ProgressState;
	error: string;
};

interface DownloadRow {
	id: string;
	parts: DownloadPart[];
};

// Unique per renderer: main broadcasts download events to every tab, and two
// tabs must never mint the same id
const salt = Math.random().toString(36).slice(2, 8);

let seq = 0;

const nextId = (prefix: string): string => `${prefix}-${salt}-${++seq}`;

const isSettled = (part: DownloadPart): boolean => part.state != I.ProgressState.Running;

/**
 * Client-owned file downloads.
 *
 * The bytes travel over the gateway rather than the RPC layer, so the
 * middleware has no process to report and no `Event.Process.*` arrives. This
 * owns that progress instead and feeds the same sidebar rows the middleware
 * processes use.
 *
 * A file is the unit of truth: every file keeps its own bytes and state, which
 * is what the row's hover detail shows. One user action is one row, combining
 * its files into a single bar.
 */
export class Download {

	rows = new Map<string, DownloadRow>();
	index = new Map<string, string>();

	/**
	 * Starts a download per file and opens the row that represents them all.
	 * @returns the row id, which is also the progress item id.
	 */
	start (files: DownloadFile[], directory: string, route: string): string {
		const rowId = nextId('download');
		const parts: DownloadPart[] = (files || []).map(file => ({
			id: nextId('file'),
			fileId: file.id,
			// Filled in from the download stack, which knows what the file is
			// actually saved as; a queued file has no name yet
			name: '',
			current: 0,
			total: 0,
			percent: 0,
			state: I.ProgressState.Running,
			error: '',
		}));

		this.rows.set(rowId, { id: rowId, parts });

		S.Progress.add({
			id: rowId,
			type: I.ProgressType.Save,
			state: I.ProgressState.Running,
			current: 0,
			total: this.scale(parts),
			canCancel: true,
			isLocal: true,
		});

		parts.forEach((part, i) => {
			const file = files[i];

			this.index.set(part.id, rowId);
			S.Common.downloadStart(file.id);

			// Always /file/, even for images: /image/ resizes, and a width of 0
			// answers with the smallest variant rather than what was uploaded.
			// attachment=1 makes the gateway send a Content-Disposition the
			// download stack can take the file name from
			const url = S.Common.fileUrl(file.id);

			Renderer.send('download', url + (url.includes('?') ? '&' : '?') + 'attachment=1', {
				id: part.id,
				directory,
			});
		});

		analytics.event('DownloadMedia', { route });

		return rowId;
	};

	/**
	 * Cancels every file in the row, running or still queued, and closes it.
	 */
	cancel (rowId: string): void {
		const row = this.rows.get(rowId);

		if (!row) {
			return;
		};

		row.parts.forEach(part => {
			if (!isSettled(part)) {
				Renderer.send('downloadCancel', part.id);
			};

			part.state = I.ProgressState.Canceled;
			part.percent = 100;
			S.Common.downloadDone(part.fileId);
		});

		S.Progress.update({ id: rowId, state: I.ProgressState.Canceled });
		this.forget(rowId);
	};

	onProgress ({ id, current, total, name }: { id: string; current: number; total: number; name?: string }): void {
		this.withPart(id, (row, part) => {
			// What the file is really saved as beats what the caller guessed
			if (name) {
				part.name = String(name);
			};

			part.current = Number(current) || 0;
			part.total = Number(total) || 0;
			part.percent = part.total ? Math.floor(part.current / part.total * 100) : 0;

			this.updateRow(row);
		});
	};

	onDone ({ id, error, isCancelled }: { id: string; path?: string; error?: string; isCancelled?: boolean }): void {
		this.withPart(id, (row, part) => {
			part.percent = 100;
			part.error = String(error || '');

			if (error) {
				part.state = I.ProgressState.Error;
			} else
			if (isCancelled) {
				part.state = I.ProgressState.Canceled;
			} else {
				part.state = I.ProgressState.Done;
				part.current = part.total || part.current;
			};

			S.Common.downloadDone(part.fileId);
			this.updateRow(row);

			if (row.parts.every(isSettled)) {
				this.close(row);
			};
		});
	};

	/**
	 * Per-file detail behind the row, for the hover list.
	 */
	getParts (rowId: string): DownloadPart[] {
		return this.rows.get(rowId)?.parts || [];
	};

	/**
	 * The file the row is working on, for its second line. Downloads run one at
	 * a time, so there is exactly one until the row is finished.
	 */
	activeName (rowId: string): string {
		const parts = this.getParts(rowId);
		const named = parts.filter(it => it.name);

		return (named.find(it => !isSettled(it)) || named[named.length - 1])?.name || '';
	};

	/**
	 * One line per file: what the row's tooltip shows.
	 */
	tooltip (rowId: string): string {
		return this.getParts(rowId).map(part => {
			const status = part.error || `${part.percent}%`;

			return part.name ? `${part.name} · ${status}` : status;
		}).join('\n');
	};

	/**
	 * A single file reports its own bytes. A batch cannot: the files still
	 * queued have no byte count yet, so each file weighs the same 100 units and
	 * the bar only ever moves forward.
	 */
	scale (parts: DownloadPart[]): number {
		return (parts.length == 1) ? (parts[0].total || 0) : parts.length * 100;
	};

	updateRow (row: DownloadRow): void {
		const { parts } = row;
		const isSingle = parts.length == 1;
		const current = isSingle ? parts[0].current : parts.reduce((sum, it) => sum + it.percent, 0);

		S.Progress.update({ id: row.id, current, total: this.scale(parts) });
	};

	close (row: DownloadRow): void {
		const { parts } = row;
		const failed = parts.find(it => it.state == I.ProgressState.Error);
		const cancelled = parts.some(it => it.state == I.ProgressState.Canceled);

		let state = I.ProgressState.Done;

		if (failed) {
			state = I.ProgressState.Error;
		} else
		if (cancelled) {
			state = I.ProgressState.Canceled;
		};

		S.Progress.update({ id: row.id, state, error: failed ? failed.error : '' });

		// A failed row keeps its place in the sidebar, so its per-file detail has
		// to outlive the download; a finished one disappears and takes it along
		this.forget(row.id, Boolean(failed));
	};

	/**
	 * Stops a closed row from taking any further events. Its detail is kept only
	 * while the row is still on screen.
	 */
	forget (rowId: string, keepDetail: boolean = false): void {
		const row = this.rows.get(rowId);

		if (!row) {
			return;
		};

		row.parts.forEach(part => this.index.delete(part.id));

		if (!keepDetail) {
			this.rows.delete(rowId);
		};
	};

	/**
	 * Events are broadcast to every tab, and a settled file must not be revived
	 * by one that arrives late.
	 */
	withPart (id: string, callBack: (row: DownloadRow, part: DownloadPart) => void): void {
		const rowId = this.index.get(id);
		const row = rowId ? this.rows.get(rowId) : null;
		const part = row ? row.parts.find(it => it.id == id) : null;

		if (part && !isSettled(part)) {
			callBack(row, part);
		};
	};

};

export default new Download();
