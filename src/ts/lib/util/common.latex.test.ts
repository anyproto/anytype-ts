import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import UtilCommon from './common';
import UtilString from './string';
import Mark from '../mark';

describe('UtilCommon.getLatex', () => {

	beforeEach(async () => {
		vi.stubGlobal('U', { String: UtilString });
		vi.stubGlobal('Mark', Mark);

		// KaTeX loads lazily when the module is imported
		await vi.waitFor(() => {
			if (UtilCommon.getLatex('$x$') == '$x$') {
				throw new Error('KaTeX not loaded');
			};
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('should keep the source of an expression in its attribute', () => {
		const html = UtilCommon.getLatex('$\\text{a" data-injected="b}$');

		expect(html).toContain('data-latex="&#36;\\text{a&quot; data-injected=&quot;b}&#36;"');
		expect(html).not.toMatch(/ data-injected="/);
	});

});
