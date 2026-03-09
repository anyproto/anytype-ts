import { JsonParser } from './jsonParser';

describe('JsonParser', () => {
	it('should parse page, database and block JSON correctly', async () => {
		const parser = new JsonParser();
		const mockFileContentsMap = new Map<string, string>();

		// Page
		mockFileContentsMap.set('page.json', JSON.stringify({
			object: 'page',
			id: '123',
			properties: {
				Name: { type: 'title', title: [{ plain_text: 'Test Page' }] },
				Status: { type: 'select', select: { name: 'Done', color: 'green' } }
			}
		}));

		// Database
		mockFileContentsMap.set('db.json', JSON.stringify({
			object: 'database',
			id: 'db123',
			properties: {
				Name: { type: 'title', title: {} },
				Status: { type: 'select', select: {} }
			}
		}));

		// Blocks
		mockFileContentsMap.set('block1.json', JSON.stringify({
			object: 'block',
			id: 'blk1',
			parent: { type: 'page_id', page_id: '123' },
			type: 'paragraph',
			has_children: true
		}));

		mockFileContentsMap.set('block2.json', JSON.stringify({
			object: 'block',
			id: 'blk2',
			parent: { type: 'block_id', block_id: 'blk1' },
			type: 'bulleted_list_item',
			has_children: false
		}));

		const workspace = await parser.parseNotionApiJson(mockFileContentsMap);

		expect(workspace.pages).toHaveLength(1);
		expect(workspace.databases).toHaveLength(1);

		// Assert Database
		const db = workspace.databases[0];
		expect(db.id).toBe('db123');
		expect((db as any).properties['Status']._mappedType).toBe('tag_single');

		// Assert Page & Property remapping
		const page = workspace.pages[0];
		expect(page.id).toBe('123');
		expect((page as any).properties['Status']._mappedType).toBe('tag_single');
		expect((page as any).properties['Name']._mappedType).toBe('text');

		// Assert Block Tree mapping
		const blocks = (page as any)._parsedBlocks;
		expect(blocks).toHaveLength(1);
		expect(blocks[0].id).toBe('blk1');
		expect(blocks[0]._mappedType).toBe('text'); // paragraph -> text
		expect(blocks[0].children).toHaveLength(1);
		expect(blocks[0].children[0].id).toBe('blk2');
		expect(blocks[0].children[0]._mappedType).toBe('bullet'); // bulleted_list_item -> bullet
	});
});
