import { JsonParser } from './jsonParser';

describe('JsonParser', () => {
	it('should parse page JSON correctly', async () => {
		const parser = new JsonParser();
		const mockFileContentsMap = new Map<string, string>();
		mockFileContentsMap.set('page.json', JSON.stringify({
			object: 'page',
			id: '123',
			properties: {
				Name: { type: 'title', title: [{ plain_text: 'Test Page' }] }
			}
		}));

		const workspace = await parser.parseNotionApiJson('mockPath', mockFileContentsMap);
		expect(workspace.pages).toHaveLength(1);
		expect(workspace.pages[0].id).toBe('123');
	});
});
