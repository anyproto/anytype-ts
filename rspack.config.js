const path = require('path');
const process = require('process');
const rspack = require('@rspack/core');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'));
const cMapsDir = path.join(pdfjsDistPath, 'cmaps');

module.exports = (env, argv) => {
	const port = process.env.SERVER_PORT;
	const prod = env === 'production';

	return {
		mode: 'development',
		devtool: 'source-map',

		optimization: {
			minimize: false,
			removeAvailableModules: true,
			removeEmptyChunks: true,
			splitChunks: false,
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
			extensions: [ '.ts', '.tsx', '.js', '.jsx' ],
			alias: {
				dist: path.resolve(__dirname, 'dist'),
				protobuf: path.resolve(__dirname, 'dist/lib'),
				json: path.resolve(__dirname, 'src/json'),
				Lib: path.resolve(__dirname, 'src/ts/lib'),
				Store: path.resolve(__dirname, 'src/ts/store'),
				Component: path.resolve(__dirname, 'src/ts/component'),
				Interface: path.resolve(__dirname, 'src/ts/interface'),
				Model: path.resolve(__dirname, 'src/ts/model'),
				Docs: path.resolve(__dirname, 'src/ts/docs'),
				Hook: path.resolve(__dirname, 'src/ts/hook'),
			},
			modules: [
				path.resolve('./src/'),
				path.resolve('./electron/'),
				path.resolve('./dist/'),
				path.resolve('./node_modules')
			]
		},
		
		devServer: {
			hot: true,
			static: {
				directory: path.join(__dirname, 'dist'),
				watch: {
					ignored: [
						path.resolve(__dirname, 'dist'),
						path.resolve(__dirname, 'node_modules')
					],
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
						if (error.message === 'ResizeObserver loop completed with undelivered notifications.') {
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
					test: /\.(j|t)s$/,
					exclude: [/[\\/]node_modules[\\/]/],
					loader: 'builtin:swc-loader',
					options: {
						jsc: {
							parser: {
								syntax: 'typescript',
							},
							externalHelpers: true,
							transform: {
								react: {
									runtime: 'automatic',
									development: !prod,
									refresh: !prod,
								},
							},
						},
						env: {
							targets: 'Chrome >= 48',
						},
					},
				},
				{
					test: /\.(j|t)sx$/,
					loader: 'builtin:swc-loader',
					exclude: [/[\\/]node_modules[\\/]/],
					options: {
						jsc: {
							parser: {
								syntax: 'typescript',
								tsx: true,
							},
							transform: {
								react: {
									runtime: 'automatic',
									development: !prod,
									refresh: !prod,
								},
							},
							externalHelpers: true,
						},
						env: {
							targets: 'Chrome >= 48', // browser compatibility
						},
					},
				},
				{
					enforce: 'pre',
					test: /\.js$/,
					loader: 'source-map-loader'
				},
				{
					test: /\.(eot|ttf|otf|woff|woff2)$/,
					loader: 'url-loader'
				},
				{
					test: /\.(jpe?g|png|gif|svg)$/,
					loader: 'url-loader'
				},
				{
					test: /\.s?css/,
					use: [
						{ loader: 'style-loader' },
						{ loader: 'css-loader' },
						{ loader: 'sass-loader' }
					]
				}
			]
		},

		plugins: [
			//new BundleAnalyzerPlugin(),

			// new rspack.IgnorePlugin({
			// 	resourceRegExp: /osx-temperature-sensor/,
			// }),

			new rspack.optimize.LimitChunkCountPlugin({
				maxChunks: 1,
			}),

			new rspack.CopyRspackPlugin({
				patterns: [
					{ from: cMapsDir, to: './cmaps/' },
				],
			}),
		],
	};
};