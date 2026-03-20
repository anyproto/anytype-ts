import { defineConfig } from 'vite';
import path from 'path';

// Minimal document/DOM shim for PixiJS in Web Worker context.
// PixiJS pipes (DOMPipe, AccessibilitySystem) access `document` in their
// constructors at module evaluation time, before WebWorkerAdapter can be set.
// This shim provides no-op DOM elements so those constructors don't crash.
const workerDomShim = `
(function() {
	if (typeof document !== 'undefined') return;
	var noop = function() {};
	var noopEl = {
		style: {},
		appendChild: noop,
		removeChild: noop,
		remove: noop,
		contains: function() { return false; },
		setAttribute: noop,
		getAttribute: noop,
		classList: { add: noop, remove: noop, toggle: noop, contains: function() { return false; } },
		addEventListener: noop,
		removeEventListener: noop,
	};
	self.document = {
		createElement: function() {
			return Object.create(noopEl);
		},
		createElementNS: function() {
			return Object.create(noopEl);
		},
		body: Object.create(noopEl),
		head: Object.create(noopEl),
		addEventListener: noop,
		removeEventListener: noop,
		baseURI: '',
	};
	if (typeof navigator === 'undefined') {
		self.navigator = { userAgent: '', maxTouchPoints: 0 };
	}
	if (typeof window === 'undefined') {
		self.window = self;
	}
})();
`;

export default defineConfig({
	build: {
		outDir: path.resolve(__dirname, 'dist/workers/lib'),
		emptyOutDir: false,
		lib: {
			entry: path.resolve(__dirname, 'src/ts/workers/pixi-worker-entry.ts'),
			name: 'pixi',
			formats: ['iife'],
			fileName: () => 'pixi.min.js',
		},
		minify: 'esbuild',
		rollupOptions: {
			output: {
				inlineDynamicImports: true,
				intro: workerDomShim,
			},
		},
	},
});
