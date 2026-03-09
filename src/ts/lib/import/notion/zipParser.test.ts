import JSZip from 'jszip';
import { ZipParser } from './zipParser';

describe('ZipParser', () => {
	it('should parse database properties correctly and extract pages', async () => {
		const parser = new ZipParser();
		const zip = new JSZip();

		const dbId = 'db123456789012345678901234567890';
		const pageId = 'pg123456789012345678901234567890'; // Must be 32 hex chars!
		const cleanPageId = '12345678901234567890123456789012';

		const csvContent = `Name,Status,Notion ID\nItem 1,Done,${cleanPageId}`;
		zip.file(`Database ${dbId}.csv`, csvContent);

		const htmlContent = `<html><head><title>Item 1</title></head><body class="page-body"><p>Hello World</p></body></html>`;
		zip.file(`Item 1 ${cleanPageId}.html`, htmlContent);

		const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

		const workspace = await parser.parseNotionZip(zipBuffer);

		expect(workspace.databases).toHaveLength(1);
		expect(workspace.databases[0].id).toBe(dbId);
		expect(workspace.databases[0].properties['Name'].type).toBe('rich_text');

		const dbPage = workspace.pages.find(p => p.id === cleanPageId) as any;

		expect(dbPage).toBeDefined();
		expect(dbPage.properties['Name'].rich_text[0].plain_text).toBe('Item 1');
		expect(dbPage._parsedBlocks).toHaveLength(1);
		expect(dbPage._parsedBlocks[0].type).toBe('text');
		expect(dbPage._parsedBlocks[0].text).toBe('Hello World');
	});
});
