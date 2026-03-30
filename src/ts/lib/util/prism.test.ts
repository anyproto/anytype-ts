import { describe, it, expect } from 'vitest';
import UtilPrism from './prism';

describe('UtilPrism', () => {

	describe('map', () => {
		it('should contain common languages', () => {
			expect(UtilPrism.map).toHaveProperty('javascript');
			expect(UtilPrism.map['javascript']).toBe('JavaScript');
		});

		it('should contain language aliases', () => {
			// 'js' is an alias for JavaScript
			expect(UtilPrism.map).toHaveProperty('js');
			expect(UtilPrism.map['js']).toBe('JavaScript');
		});

		it('should contain Python', () => {
			expect(UtilPrism.map).toHaveProperty('python');
			expect(UtilPrism.map['python']).toBe('Python');
		});
	});

	describe('components', () => {
		it('should return an array of language keys', () => {
			const components = UtilPrism.components;

			expect(Array.isArray(components)).toBe(true);
			expect(components.length).toBeGreaterThan(0);
		});

		it('should contain no duplicates', () => {
			const components = UtilPrism.components;
			const unique = [...new Set(components)];

			expect(components.length).toBe(unique.length);
		});

		it('should include common languages', () => {
			const components = UtilPrism.components;

			expect(components).toContain('javascript');
			expect(components).toContain('python');
			expect(components).toContain('css');
		});
	});

	describe('getValueKeyMap', () => {
		it('should return a Map', () => {
			const vkMap = UtilPrism.getValueKeyMap();

			expect(vkMap).toBeInstanceOf(Map);
		});

		it('should map display titles to arrays of keys', () => {
			const vkMap = UtilPrism.getValueKeyMap();
			const jsKeys = vkMap.get('JavaScript');

			expect(Array.isArray(jsKeys)).toBe(true);
			expect(jsKeys).toContain('javascript');
			expect(jsKeys).toContain('js');
		});
	});

	describe('aliasMap', () => {
		it('should map aliases to canonical keys', () => {
			// Both 'js' and 'javascript' should map to the same canonical key
			expect(UtilPrism.aliasMap['js']).toBe(UtilPrism.aliasMap['javascript']);
		});
	});

	describe('getTitles', () => {
		it('should return array of id/name objects', () => {
			const titles = UtilPrism.getTitles();

			expect(Array.isArray(titles)).toBe(true);
			expect(titles.length).toBeGreaterThan(0);
			expect(titles[0]).toHaveProperty('id');
			expect(titles[0]).toHaveProperty('name');
		});

		it('should include JavaScript', () => {
			const titles = UtilPrism.getTitles();
			const js = titles.find(t => t.name === 'JavaScript');

			expect(js).toBeDefined();
		});
	});

});
