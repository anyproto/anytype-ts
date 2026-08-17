import { describe, it, expect } from 'vitest';
import UtilDom from './dom';

describe('UtilDom', () => {

	describe('getAnchorRect', () => {

		const winSize = { ww: 1000, wh: 800 };

		it('should keep a rect which has area', () => {
			const rect = UtilDom.getAnchorRect({ x: 120, y: 240, width: 80, height: 24 }, winSize);

			expect(rect).toEqual({ x: 120, y: 240, width: 80, height: 24, isFallback: false });
		});

		it('should keep a zero size rect which has a position', () => {
			const rect = UtilDom.getAnchorRect({ x: 120, y: 240, width: 0, height: 0 }, winSize);

			expect(rect).toEqual({ x: 120, y: 240, width: 0, height: 0, isFallback: false });
		});

		it('should keep a rect which is positioned at the origin but has area', () => {
			const rect = UtilDom.getAnchorRect({ x: 0, y: 0, width: 40, height: 12 }, winSize);

			expect(rect).toEqual({ x: 0, y: 0, width: 40, height: 12, isFallback: false });
		});

		it('should fall back to the window centre when there is no rect', () => {
			const rect = UtilDom.getAnchorRect(null, winSize);

			expect(rect).toEqual({ x: 500, y: 400, width: 0, height: 0, isFallback: true });
		});

		it('should fall back to the window centre for a hidden element, which has an all zero rect', () => {
			const rect = UtilDom.getAnchorRect({ x: 0, y: 0, width: 0, height: 0 }, winSize);

			expect(rect).toEqual({ x: 500, y: 400, width: 0, height: 0, isFallback: true });
		});

		it('should handle missing window dimensions', () => {
			const rect = UtilDom.getAnchorRect(null, null);

			expect(rect).toEqual({ x: 0, y: 0, width: 0, height: 0, isFallback: true });
		});

	});

});
