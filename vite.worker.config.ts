import { defineConfig } from 'vite';
import path from 'path';

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
			},
		},
	},
});
