const path = require('path');
const process = require('process');
const rspack = require('@rspack/core');
// const CopyWebpackPlugin = require('copy-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'));
const cMapsDir = path.join(pdfjsDistPath, 'cmaps');

module.exports = (env, argv) => {
	const port = process.env.SERVER_PORT;

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
					test: /\.ts(x?)$/,
					exclude: /node_modules/,
					loader: 'ts-loader'
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

		bail: true,
		infrastructureLogging: {
			appendOnly: true,
			level: 'verbose',
		},

		stats: {
			logging: 'verbose',
		},

		plugins: [
			//new BundleAnalyzerPlugin(),

			// new rspack.IgnorePlugin({
			// 	resourceRegExp: /osx-temperature-sensor/,
			// }),

			// new rspack.optimize.LimitChunkCountPlugin({
			// 	maxChunks: 1,
			// }),

			// new CopyWebpackPlugin({
			// 	patterns: [
			// 		{ from: cMapsDir, to: './cmaps/' },
			// 	],
			// }),
		],
	};
};