import JSZip from 'jszip';
import { NotionWorkspace, NotionPage, NotionDatabase, NOTION_PROPERTY_TYPE_MAP } from './types';
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
			const parsedDb = this.parseDatabaseCsv(dbId, csvContent);
			workspace.databases.push(parsedDb);

			// Match CSV rows with HTML files for page bodies
			const rows = this.parseCsvRows(csvContent);
			for (let i = 1; i < rows.length; i++) {
				const row = rows[i];
				const pageId = this.extractIdFromRow(row);
				const pageHtmlPath = htmlFiles.find(p => p.includes(pageId) && p.startsWith(dirPath));

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
					properties: this.mapRowToProperties(rows[0], row),
					url: '',
					// store parsed blocks in a custom property for processing later
					_parsedBlocks: blocks
				} as any;

				workspace.pages.push(page);
			}
		}

		// Parse non-database pages
		for (const htmlPath of htmlFiles) {
			const isDatabasePage = workspace.pages.some(p => htmlPath.includes(p.id));
			if (!isDatabasePage && !htmlPath.includes('Export-')) {
				const pageId = this.extractIdFromFilename(htmlPath);
				const htmlContent = await unzipped.files[htmlPath].async('string');
				const blocks = htmlParser.parse(htmlContent);

				const page: NotionPage = {
					object: 'page',
					id: pageId,
					created_time: new Date().toISOString(),
					last_edited_time: new Date().toISOString(),
					parent: { type: 'workspace' },
					archived: false,
					properties: { title: { type: 'title', title: [{ plain_text: this.extractTitleFromFilename(htmlPath) }] } },
					url: '',
					_parsedBlocks: blocks
				} as any;

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

	private extractIdFromRow(row: string[]): string {
		// Mock implementation, would look for ID in a hidden column or generate one
		return `row-id-${Date.now()}-${Math.random()}`;
	}

	private parseDatabaseCsv(dbId: string, csvContent: string): NotionDatabase {
		const rows = this.parseCsvRows(csvContent);
		const headers = rows[0] || [];

		const properties: Record<string, any> = {};
		headers.forEach(header => {
			// Basic inference: default to text, attempt to infer type based on typical Notion headers
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
		return csvContent.split('\n').filter(line => line.trim() !== '').map(line => line.split(','));
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
