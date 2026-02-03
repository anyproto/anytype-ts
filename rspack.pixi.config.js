/**
 * Rspack configuration to bundle PixiJS for use in web workers with importScripts.
 *
 * Run: npx rspack --config rspack.pixi.config.js
 * Output: dist/workers/lib/pixi.min.js
 */
const path = require('path');
const rspack = require('@rspack/core');

module.exports = {
	mode: 'production',
	target: 'webworker',

	entry: {
		pixi: './src/ts/workers/pixi-worker-entry.ts',
	},

	output: {
		path: path.resolve(__dirname, 'dist/workers/lib'),
		filename: '[name].min.js',
		library: {
			type: 'self',
		},
	},

	resolve: {
		extensions: ['.ts', '.js'],
	},

	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				loader: 'builtin:swc-loader',
				options: {
					jsc: {
						parser: {
							syntax: 'typescript',
						},
					},
					env: {
						targets: 'Chrome >= 48',
					},
				},
			},
		],
	},

	optimization: {
		minimize: true,
		minimizer: [
			new rspack.SwcJsMinimizerRspackPlugin({
				minimizerOptions: {
					mangle: true,
					compress: true,
				},
			}),
		],
	},

	plugins: [
		new rspack.optimize.LimitChunkCountPlugin({
			maxChunks: 1,
		}),
	],
};
