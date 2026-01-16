const path = require('path');
const process = require('process');
const rspack = require('@rspack/core');
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { RsdoctorRspackPlugin } = require('@rsdoctor/rspack-plugin');

const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'));
const cMapsDir = path.join(pdfjsDistPath, 'cmaps');

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
				// Use full mermaid ESM build to avoid lazy-loading issues with architecture-beta diagrams
				'mermaid': path.resolve(__dirname, 'node_modules/mermaid/dist/mermaid.esm.mjs'),
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

		resolve: {
			...base.resolve,
			alias: {
				...base.resolve.alias,
				'@excalidraw/excalidraw': path.resolve(__dirname, 'src/stubs/excalidraw.js'),
				'@viz-js/viz': path.resolve(__dirname, 'src/stubs/viz.js'),
				'mermaid': path.resolve(__dirname, 'src/stubs/mermaid.js'),
			},
		},

		plugins: [
			...base.plugins,
			new rspack.DefinePlugin({
				__IS_EXTENSION__: 'true',
			})
		],
	};

	// Web config: browser-only mode without Electron
	const webPort = process.env.WEB_PORT || 9090;
	const webConfig = {
		name: 'web',
		...base,

		entry: {
			web: {
				import: './src/ts/entry.web.tsx',
				filename: 'js/main.js',
			},
		},

		output: {
			path: path.resolve(__dirname, 'dist-web'),
			publicPath: '/',
		},

		devServer: {
			hot: true,
			static: [
				{ directory: path.resolve(__dirname, 'dist'), publicPath: '/' },
				{ directory: path.resolve(__dirname, 'dist-web'), publicPath: '/' },
			],
			watchFiles: {
				paths: ['src'],
				options: {
					usePolling: false,
				},
			},
			historyApiFallback: true,
			host: '0.0.0.0',
			port: webPort,
			allowedHosts: 'all',
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
				'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
			},
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
			// File upload proxy for web mode - writes files to temp so backend can access them
			setupMiddlewares: (middlewares, devServer) => {
				const fs = require('fs').promises;
				const fsSync = require('fs');
				const os = require('os');
				const uploadDir = path.join(os.tmpdir(), 'anytype-web-uploads');
				const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit

				// Ensure upload directory exists (sync on startup is acceptable)
				if (!fsSync.existsSync(uploadDir)) {
					fsSync.mkdirSync(uploadDir, { recursive: true });
				}

				// Sanitize filename to prevent path traversal
				const sanitizeFilename = (filename) => {
					return String(filename || 'file')
						.replace(/[/\\:\x00]/g, '_')
						.replace(/^\.+/, '_');
				};

				devServer.app.post('/api/web-upload', (req, res) => {
					const chunks = [];
					let totalSize = 0;

					req.on('data', chunk => {
						totalSize += chunk.length;
						if (totalSize > MAX_FILE_SIZE * 1.4) {
							req.destroy();
							return;
						}
						chunks.push(chunk);
					});

					req.on('end', async () => {
						try {
							const body = JSON.parse(Buffer.concat(chunks).toString());
							const { filename, content } = body; // content is base64

							if (!filename || !content) {
								return res.status(400).json({ error: 'Missing filename or content' });
							}

							// Decode base64 content
							const buffer = Buffer.from(content, 'base64');

							if (buffer.length > MAX_FILE_SIZE) {
								return res.status(413).json({ error: 'File too large' });
							}

							// Generate unique filename with sanitization
							const safeName = sanitizeFilename(filename);
							const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${safeName}`;
							const filePath = path.join(uploadDir, uniqueName);

							await fs.writeFile(filePath, buffer);
							console.log('[Web Upload] File saved:', filePath);

							res.json({ path: filePath });
						} catch (e) {
							console.error('[Web Upload] Error:', e);
							res.status(500).json({ error: e.message });
						}
					});
				});

				return middlewares;
			},
		},

		plugins: [
			...base.plugins,
			new rspack.DefinePlugin({
				__IS_WEB__: 'true',
			}),
			new rspack.HtmlRspackPlugin({
				template: path.resolve(__dirname, 'dist/index.web.html'),
				filename: 'index.html',
				inject: 'body',
				scriptLoading: 'blocking',
			}),
		],
	};

	// Return configs based on build target
	const buildTarget = env?.target || process.env.BUILD_TARGET;
	if (buildTarget === 'web') {
		return [ webConfig ];
	}

	return [ appConfig, extensionConfig ];
};