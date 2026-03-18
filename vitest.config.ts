import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx'],
		alias: [
			{ find: 'dist', replacement: path.resolve(__dirname, 'dist') },
			{ find: 'protobuf', replacement: path.resolve(__dirname, 'dist/lib') },
			{ find: 'json', replacement: path.resolve(__dirname, 'src/json') },
			{ find: 'Lib', replacement: path.resolve(__dirname, 'src/ts/lib') },
			{ find: 'Store', replacement: path.resolve(__dirname, 'src/ts/store') },
			{ find: 'Component', replacement: path.resolve(__dirname, 'src/ts/component') },
			{ find: 'Interface', replacement: path.resolve(__dirname, 'src/ts/interface') },
			{ find: 'Model', replacement: path.resolve(__dirname, 'src/ts/model') },
			{ find: 'Docs', replacement: path.resolve(__dirname, 'src/ts/docs') },
			{ find: 'Hook', replacement: path.resolve(__dirname, 'src/ts/hook') },
			{ find: 'Proto', replacement: path.resolve(__dirname, 'middleware') },
		],
	},
	test: {
		include: ['src/**/*.test.ts'],
		globals: true,
		environment: 'node',
		setupFiles: ['src/ts/test/setup.ts'],
	},
});
