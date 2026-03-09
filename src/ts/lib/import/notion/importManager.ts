import * as fs from 'fs';
import * as path from 'path';

export interface ImportState {
	id: string;
	status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
	progress: number;
	total: number;
	currentFileId: string | null;
	checkpointPath: string | null;
	zipPath: string | null;
}

export class ImportManager {
	private readonly importDir: string;
	private currentState: ImportState | null = null;
	private _cancelRequested: boolean = false;

	constructor(importDir: string) {
		this.importDir = importDir;
		if (!fs.existsSync(importDir)) {
			fs.mkdirSync(importDir, { recursive: true });
		}
	}

	async startImport(zipFile: string, totalFiles: number): Promise<string> {
		const importId = Date.now().toString();
		const zipCopyPath = path.join(this.importDir, `notion-${importId}.zip`);
		const checkpointPath = path.join(this.importDir, `notion-${importId}.json`);

		fs.copyFileSync(zipFile, zipCopyPath);

		this.currentState = {
			id: importId,
			status: 'running',
			progress: 0,
			total: totalFiles,
			currentFileId: null,
			checkpointPath,
			zipPath: zipCopyPath
		};

		this.saveCheckpoint(checkpointPath, this.currentState);

		return importId;
	}

	async processBatch(batch: string[]): Promise<void> {
		if (this._cancelRequested) {
			this.currentState!.status = 'cancelled';
			this.saveCheckpoint(this.currentState!.checkpointPath!, this.currentState!);
			return;
		}

		for (const fileId of batch) {
			// Mock process file
			this.currentState!.progress++;
			this.currentState!.currentFileId = fileId;

			// Simulate yield
			await new Promise(resolve => setTimeout(resolve, 0));
		}

		this.saveCheckpoint(this.currentState!.checkpointPath!, this.currentState!);
	}

	private saveCheckpoint(checkpointPath: string, state: ImportState) {
		fs.writeFileSync(checkpointPath, JSON.stringify(state));
	}

	async resumeImport(importId: string): Promise<ImportState> {
		const checkpointPath = path.join(this.importDir, `notion-${importId}.json`);
		if (fs.existsSync(checkpointPath)) {
			const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
			this.currentState = checkpoint;
			return checkpoint;
		}
		throw new Error('Checkpoint not found');
	}

	cancelImport() {
		this._cancelRequested = true;
	}

	async cleanup(importId: string) {
		const zipCopyPath = path.join(this.importDir, `notion-${importId}.zip`);
		const checkpointPath = path.join(this.importDir, `notion-${importId}.json`);
		if (fs.existsSync(zipCopyPath)) fs.unlinkSync(zipCopyPath);
		if (fs.existsSync(checkpointPath)) fs.unlinkSync(checkpointPath);
		this.currentState = null;
	}
}
