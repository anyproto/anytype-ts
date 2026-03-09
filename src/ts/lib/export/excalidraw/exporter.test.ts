import { exportToExcalidraw } from './exporter';

describe('Excalidraw exporter', () => {
	it('should serialize elements into JSON string', async () => {
		const jsonStr = await exportToExcalidraw([{ type: 'rectangle' }], {} as any, {});
		const parsed = JSON.parse(jsonStr);
		expect(parsed.type).toBe('excalidraw');
		expect(parsed.elements[0].type).toBe('rectangle');
	});
});
