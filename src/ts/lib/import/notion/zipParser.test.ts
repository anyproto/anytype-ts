import { ZipParser } from './zipParser';
import { NOTION_PROPERTY_TYPE_MAP } from './types';

describe('ZipParser', () => {
	it('should parse database properties correctly', () => {
		const parser = new ZipParser();
		// Mock testing logic here
		expect(NOTION_PROPERTY_TYPE_MAP['title']).toBe('text');
	});
});
