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

	/**
	 * Regression coverage for the Table of contents highlight being off by one: clicking an item
	 * scrolled to the right header, but the menu highlighted its neighbour.
	 *
	 * Geometry: scrollToHeader parks the header J.Size.header (52) + 20 = 72px below the scroll
	 * container's top, so it clears the sticky page header. Detection used to mark a header active
	 * only once its top passed the container's top edge (0) — an offset the clicked header never
	 * reaches — so the previous header stayed highlighted.
	 *
	 * Tops are offsets of the header blocks relative to the scroll container's top edge.
	 */
	describe('getActiveHeaderIndex', () => {

		const ANCHOR = 72;

		it('should activate the header parked at the scroll anchor', () => {
			expect(UtilDom.getActiveHeaderIndex([ -320, -140, 72, 260, 520 ], ANCHOR)).toBe(2);
		});

		it('should activate the last header above the anchor', () => {
			expect(UtilDom.getActiveHeaderIndex([ -320, -140, 30, 260 ], ANCHOR)).toBe(2);
		});

		it('should keep a header active until the next one reaches the anchor', () => {
			expect(UtilDom.getActiveHeaderIndex([ -320, 73, 400 ], ANCHOR)).toBe(0);
		});

		it('should fall back to the first header when none of them reached the anchor', () => {
			expect(UtilDom.getActiveHeaderIndex([ 240, 500 ], ANCHOR)).toBe(0);
		});

		it('should return -1 without headers', () => {
			expect(UtilDom.getActiveHeaderIndex([], ANCHOR)).toBe(-1);
		});

	});

});
