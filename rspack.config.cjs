const path = require('path');
const process = require('process');
const rspack = require('@rspack/core');
const ReactRefreshRspackPlugin = require('@rspack/plugin-react-refresh');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { RsdoctorRspackPlugin } = require('@rsdoctor/rspack-plugin');

const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'));
const cMapsDir = path.join(pdfjsDistPath, 'cmaps');

const { defineConfig } = require('@rspack/cli');

module.exports = defineConfig((env, argv) => {
	const port = process.env.SERVER_PORT;
	const isDev = typeof env.production === 'undefined';

	return {
		experiments: {
			rspackFuture: {
				disableTransformByDefault: true,
			},
		},

		mode: isDev ? 'development' : 'production',
		devtool: 'eval-source-map',

		optimization: {
			moduleIds: 'deterministic',
			removeAvailableModules: true,
			removeEmptyChunks: true,
			splitChunks: false,
			mergeDuplicateChunks: true,
		},

		entry: {
			app: {
				import: './src/ts/entry.tsx',
				filename: 'js/main.js',
			},
			extension: {
				import: './extension/entry.tsx',
				filename: 'extension/js/main.js',
			},
		},

		resolve: {
			tsConfig: path.resolve(__dirname, 'tsconfig.json'),
			extensions: ['.ts', '.tsx', '.js', '.jsx'],
			modules: [
				path.resolve('./src/'),
				path.resolve('./electron/'),
				path.resolve('./dist/'),
				path.resolve('./node_modules'),
			],
		},

		watchOptions: {
			ignored: /node_modules/,
			poll: false,
		},

		devServer: {
			hot: true,
			static: ['dist'],
			watchFiles: {
				paths: ['src'],
				options: {
					usePolling: false,
				},
			},
			historyApiFallback: true,
			host: 'localhost',
			port,
			client: {
				progress: false,
				overlay: {
					runtimeErrors: (error) => {
						if (
							error.message ===
							'ResizeObserver loop completed with undelivered notifications.'
						) {
							return false;
						}

						return true;
					},
				},
			},
		},

		module: {
			rules: [
				{
					test: /\.(js|ts)$/,
					exclude: [/[\\/]node_modules[\\/]/],
					loader: 'builtin:swc-loader',
					options: {
						sourceMap: true,
						jsc: {
							parser: {
								syntax: 'typescript',
							},
							externalHelpers: true,
						},
						env: {
							targets: 'Chrome >= 89',
						},
					},
				},
				{
					test: /\.(jsx|tsx)$/,
					exclude: [/[\\/]node_modules[\\/]/],
					loader: 'builtin:swc-loader',
					options: {
						sourceMap: true,
						jsc: {
							parser: {
								syntax: 'typescript',
								tsx: true,
							},
							externalHelpers: true,
							transform: {
								react: {
									runtime: 'automatic',
									development: isDev,
									refresh: isDev,
								},
							},
						},
						env: {
							targets: 'Chrome >= 89',
						},
					},
				},
				{
					enforce: 'pre',
					test: /\.js$/,
					loader: 'source-map-loader',
				},
				{
					test: /\.(eot|ttf|otf|woff|woff2)$/,
					type: 'asset/inline',
				},
				{
					test: /\.(jpe?g|png|gif|svg)$/,
					type: 'asset/inline',
				},
				{
					test: /\.s?css/,
					use: [
						{ loader: 'style-loader' },
						{ loader: 'css-loader' },
						{ loader: 'sass-loader' },
					],
				},
			],
		},

		plugins: [
			isDev && new ReactRefreshRspackPlugin(),

			process.env.RSDOCTOR &&
			new RsdoctorRspackPlugin({
				linter: {
					rules: {
						'ecma-version-check': 'off',
					},
				},
				supports: {
					generateTileGraph: true,
					parseBundle: true,
				},
				reportDir: path.resolve(__dirname, '.rsdoctor'),
			}),

			new ForkTsCheckerWebpackPlugin(),

			// new rspack.IgnorePlugin({
			// 	resourceRegExp: /osx-temperature-sensor/,
			// }),

			new rspack.optimize.LimitChunkCountPlugin({
				maxChunks: 1,
			}),

			new rspack.CopyRspackPlugin({
				patterns: [{ from: cMapsDir, to: './cmaps/' }],
			}),
		].filter(Boolean),
	};
});
