const path = require('path');
const process = require('process');
const rspack = require('@rspack/core');
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { RsdoctorRspackPlugin } = require('@rsdoctor/rspack-plugin');

const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'));
const cMapsDir = path.join(pdfjsDistPath, 'cmaps');

// Stub for Excalidraw in extension build
const EXCALIDRAW_STUB = path.resolve(__dirname, 'src/stubs/excalidraw-stub.js');

module.exports = (env, argv) => {
	const port = process.env.SERVER_PORT || 8080;
	const prod = argv.mode === 'production';

	const base = {
		mode: 'development',
		devtool: 'source-map',

		optimization: {
			minimize: false,
			removeAvailableModules: true,
			removeEmptyChunks: true,
			splitChunks: false,
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

		watchOptions: {
			ignored: /node_modules/,
			poll: false,
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
						},
						env: {
							targets: 'Chrome >= 48', // browser compatibility
						},
					},
				},
				{
					enforce: 'pre',
					test: /\.js$/,
					exclude: [ /node_modules\/@excalidraw/ ],
					loader: 'source-map-loader'
				},
				{
					test: /\.(eot|ttf|otf|woff|woff2)$/,
					type: 'asset/inline'
				},
				{
					test: /\.(jpe?g|png|gif|svg)$/,
					type: 'asset/inline'
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
			!prod && new ReactRefreshPlugin(),
			process.env.RSDOCTOR && new RsdoctorRspackPlugin({}),
			
			new ForkTsCheckerWebpackPlugin(),

			new rspack.optimize.LimitChunkCountPlugin({
				maxChunks: 1,
			}),

			new rspack.CopyRspackPlugin({
				patterns: [
					{ from: cMapsDir, to: './cmaps/' },
				],
			}),

			// Define environment variables for the browser with defaults
			new rspack.DefinePlugin({
				'SPARK_ONBOARDING_URL': JSON.stringify(process.env.SPARK_ONBOARDING_URL || 'wss://stage1-anytype-spark.anytype.io'),
				'SPARK_ONBOARDING_TOKEN': JSON.stringify(process.env.SPARK_ONBOARDING_TOKEN || 'spark_92eabe0c7f006ff22b0d81f3974b355556756afd3262249e4a748076c4483869'),
				'SPARK_ONBOARDING_NO_AUTH': JSON.stringify(process.env.SPARK_ONBOARDING_NO_AUTH || 'false'),
				'SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN || 'https://44e6df81644c4e36b21b1dbea62b8a1a@sentry.anytype.io/3'),
				'process.env': {}
			}),
		].filter(Boolean),
	};

	// App config: keeps Excalidraw
	const appConfig = {
		name: 'app',
		...base,
		entry: {
			app: { 
				import: './src/ts/entry.tsx', 
				filename: 'js/main.js',
			},
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
						const allowed = [
							'ResizeObserver loop completed with undelivered notifications.',
							'Worker was terminated',
						];
						return !allowed.includes(error.message);
					},
				},
			},
		},
	};

	// Extension config: same code, but Excalidraw is stubbed
	const extensionConfig = {
		name: 'extension',
		...base,
		entry: {
			extension: {
				import: './extension/entry.tsx',
				filename: 'extension/js/main.js',
			},
		},
		// override resolve.alias to stub excalidraw
		resolve: {
			...base.resolve,
			alias: {
				...base.resolve.alias,
				'@excalidraw/excalidraw': EXCALIDRAW_STUB,
			},
		},
		// no devServer for extension
	};

	return [ appConfig, extensionConfig ];
};