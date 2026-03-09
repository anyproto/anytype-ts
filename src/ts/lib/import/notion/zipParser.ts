import JSZip from 'jszip';
import Papa from 'papaparse';
import { NotionWorkspace, NotionPage, NotionDatabase } from './types';
import { HtmlParser } from './htmlParser';

export class ZipParser {
	async parseNotionZip(zipFile: File | ArrayBuffer): Promise<NotionWorkspace> {
		const zip = new JSZip();
		const unzipped = await zip.loadAsync(zipFile);

		const workspace: NotionWorkspace = {
			pages: [],
			databases: []
		};

		const filePaths = Object.keys(unzipped.files);

		const csvFiles = filePaths.filter(path => path.endsWith('.csv'));
		const htmlFiles = filePaths.filter(path => path.endsWith('.html'));

		const htmlParser = new HtmlParser();

		for (const csvPath of csvFiles) {
			const dirPath = csvPath.substring(0, csvPath.lastIndexOf('/'));
			const dbId = this.extractIdFromFilename(csvPath);

			const csvContent = await unzipped.files[csvPath].async('string');
			const rows = this.parseCsvRows(csvContent);

			const parsedDb = this.parseDatabaseCsv(dbId, rows);
			workspace.databases.push(parsedDb);

			const headers = rows[0] || [];
			const idColIndex = headers.findIndex(h => h === 'Notion ID' || h.toLowerCase() === 'id');

			for (let i = 1; i < rows.length; i++) {
				const row = rows[i];
				const pageId = this.extractIdFromRow(row, dbId, i, idColIndex); // Stable ID per row
				const pageHtmlPath = htmlFiles.find(p => p.includes(pageId) && (dirPath === '' || p.startsWith(dirPath)));

				let blocks = [];
				if (pageHtmlPath) {
					const htmlContent = await unzipped.files[pageHtmlPath].async('string');
					blocks = htmlParser.parse(htmlContent);
				}

				const page: NotionPage = {
					object: 'page',
					id: pageId,
					created_time: new Date().toISOString(), // Mocked or extracted from row if available
					last_edited_time: new Date().toISOString(),
					parent: { type: 'database_id', database_id: dbId },
					archived: false,
					properties: this.mapRowToProperties(headers, row),
					url: '',
					_parsedBlocks: blocks
				};

				workspace.pages.push(page);
			}
		}

		// Parse non-database pages
		for (const htmlPath of htmlFiles) {
			const pageId = this.extractIdFromFilename(htmlPath);
			// Check if any database row extracted this page ID or if the ID exists in filename
			const isDatabasePage = workspace.pages.some(p => p.id === pageId || htmlPath.includes(p.id));
			if (!isDatabasePage && !htmlPath.includes('Export-')) {
				const htmlContent = await unzipped.files[htmlPath].async('string');
				const blocks = htmlParser.parse(htmlContent);

				const page: NotionPage = {
					object: 'page',
					id: pageId,
					created_time: new Date().toISOString(),
					last_edited_time: new Date().toISOString(),
					parent: { type: 'workspace', workspace: true },
					archived: false,
					properties: { title: { type: 'title', title: [{ plain_text: this.extractTitleFromFilename(htmlPath) }] } },
					url: '',
					_parsedBlocks: blocks
				};

				workspace.pages.push(page);
			}
		}

		return workspace;
	}

	private extractIdFromFilename(filename: string): string {
		const match = filename.match(/([a-f0-9]{32})/i);
		return match ? match[1] : `mock-id-${Date.now()}`;
	}

	private extractTitleFromFilename(filename: string): string {
		const parts = filename.split('/');
		const filePart = parts[parts.length - 1];
		return filePart.replace(/ [a-f0-9]{32}\.html$/i, '');
	}

	private extractIdFromRow(row: string[], dbId: string, rowIndex: number, idColIndex: number): string {
		if (idColIndex !== -1 && row[idColIndex] && row[idColIndex].match(/^[a-f0-9]{32}$/i)) {
			return row[idColIndex];
		}
		// Fallback regex scan
		const fallbackMatch = row.findIndex(c => c && c.match(/^[a-f0-9]{32}$/i));
		if (fallbackMatch !== -1) return row[fallbackMatch];

		return `row-id-${dbId}-${rowIndex}`;
	}

	private parseDatabaseCsv(dbId: string, rows: string[][]): NotionDatabase {
		const headers = rows[0] || [];

		const properties: Record<string, any> = {};
		headers.forEach(header => {
			properties[header] = { type: 'rich_text' };
		});

		return {
			object: 'database',
			id: dbId,
			title: [],
			description: [],
			properties
		};
	}

	private parseCsvRows(csvContent: string): string[][] {
		const parsed = Papa.parse(csvContent, { skipEmptyLines: true });
		if (parsed.errors && parsed.errors.length > 0) {
			console.warn(`Encountered CSV Parsing Errors:`, parsed.errors);
		}
		return parsed.data as string[][];
	}

	private mapRowToProperties(headers: string[], row: string[]): Record<string, any> {
		const properties: Record<string, any> = {};
		headers.forEach((header, index) => {
			const value = row[index] || '';
			properties[header] = { type: 'rich_text', rich_text: [{ plain_text: value }] };
		});
		return properties;
	}
}
