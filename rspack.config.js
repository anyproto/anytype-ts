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
		//devtool: 'source-map',

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
				// source-map-loader causes V8 to retain multiple copies of the bundle in memory
				// Only enable when explicitly needed for debugging external libraries
				...(process.env.ENABLE_SOURCE_MAPS ? [{
					enforce: 'pre',
					test: /\.js$/,
					exclude: [ /node_modules\/@excalidraw/ ],
					loader: 'source-map-loader'
				}] : []),
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

	// Extension config: same code, but heavy dependencies are stubbed and code is split into chunks
	const extensionConfig = {
		name: 'extension',
		...base,

		entry: {
			main: './extension/entry.tsx',
		},

		output: {
			...base.output,
			path: path.resolve(__dirname, 'dist'),
			filename: 'extension/js/chunks/[name].js',
			chunkFilename: 'extension/js/chunks/[name].js',
			cssFilename: 'extension/css/chunks/[name].css',
			cssChunkFilename: 'extension/css/chunks/[name].css',
		},

		// Override CSS rules to use CSS extraction instead of style-loader
		module: {
			...base.module,
			rules: [
				...base.module.rules.filter(rule => !rule.test?.toString().includes('css')),
				{
					test: /\.s?css$/,
					use: [
						rspack.CssExtractRspackPlugin.loader,
						{ loader: 'css-loader' },
						{ loader: 'sass-loader' }
					]
				}
			]
		},

		optimization: {
			...base.optimization,
			minimize: true,
			minimizer: [
				new rspack.SwcJsMinimizerRspackPlugin({
					minimizerOptions: {
						mangle: false, // Don't mangle names - preserves gRPC service method names
						compress: true,
					},
				}),
			],
			splitChunks: {
				chunks: 'all',
				maxSize: 3 * 1024 * 1024, // 3MB max per chunk (safety margin for 5MB limit)
				minSize: 10000, // Allow smaller chunks to enable more splitting
				cacheGroups: {
					// Force CSS/SCSS modules into smaller chunks
					styles: {
						test: /\.s?css$/,
						name: 'styles',
						chunks: 'all',
						priority: 40,
						maxSize: 2 * 1024 * 1024, // 2MB max for CSS chunks
						enforce: true,
					},
					// Split protobuf commands (largest file ~8MB) into smaller chunks
					protobufCommands: {
						test: /[\\/]dist[\\/]lib[\\/]pb[\\/]protos[\\/]commands_pb\.js$/,
						name: 'pb-commands',
						chunks: 'all',
						priority: 35,
						maxSize: 2 * 1024 * 1024, // Force 2MB chunks for this file
					},
					// Separate protobuf events
					protobufEvents: {
						test: /[\\/]dist[\\/]lib[\\/]pb[\\/]protos[\\/]events_pb\.js$/,
						name: 'pb-events',
						chunks: 'all',
						priority: 34,
					},
					// Separate protobuf models
					protobufModels: {
						test: /[\\/]dist[\\/]lib[\\/]pb[\\/]protos[\\/]models_pb\.js$/,
						name: 'pb-models',
						chunks: 'all',
						priority: 33,
					},
					// Other protobuf files
					protobuf: {
						test: /[\\/]dist[\\/]lib[\\/]pb[\\/]/,
						name: 'protobuf',
						chunks: 'all',
						priority: 30,
					},
					// MobX and React
					react: {
						test: /[\\/]node_modules[\\/](react|react-dom|mobx|mobx-react)[\\/]/,
						name: 'react',
						chunks: 'all',
						priority: 25,
					},
					// Separate vendor libs
					vendor: {
						test: /[\\/]node_modules[\\/]/,
						name: 'vendor',
						chunks: 'all',
						priority: 20,
					},
				},
			},
		},

		resolve: {
			...base.resolve,
			alias: {
				...base.resolve.alias,
				// Existing stubs
				'@excalidraw/excalidraw': path.resolve(__dirname, 'src/stubs/excalidraw.js'),
				'@viz-js/viz': path.resolve(__dirname, 'src/stubs/viz.js'),
				'mermaid': path.resolve(__dirname, 'src/stubs/mermaid.js'),
				// Additional stubs for heavy dependencies
				'amplitude-js': path.resolve(__dirname, 'src/stubs/amplitude.js'),
				'@sentry/browser': path.resolve(__dirname, 'src/stubs/sentry.js'),
				'd3': path.resolve(__dirname, 'src/stubs/d3.js'),
				'react-pdf': path.resolve(__dirname, 'src/stubs/pdfjs.js'),
				'pdfjs-dist': path.resolve(__dirname, 'src/stubs/pdfjs.js'),
				'katex': path.resolve(__dirname, 'src/stubs/katex.js'),
				'pako': path.resolve(__dirname, 'src/stubs/pako.js'),
				'prismjs': path.resolve(__dirname, 'src/stubs/prismjs.js'),
			},
		},

		plugins: [
			// Filter out LimitChunkCountPlugin to allow code splitting
			...base.plugins.filter(p => !(p instanceof rspack.optimize.LimitChunkCountPlugin)),
			new rspack.CssExtractRspackPlugin({
				filename: 'extension/css/chunks/[name].css',
				chunkFilename: 'extension/css/chunks/[name].css',
			}),
			new rspack.DefinePlugin({
				__IS_EXTENSION__: 'true',
			}),
			// Generate manifest for chunk loading
			{
				apply(compiler) {
					compiler.hooks.emit.tapAsync('ExtensionManifestPlugin', (compilation, callback) => {
						const entrypoint = compilation.entrypoints.get('main');
						if (entrypoint) {
							const jsChunks = [];
							const cssChunks = [];
							for (const chunk of entrypoint.chunks) {
								for (const file of chunk.files) {
									if (file.endsWith('.js')) {
										jsChunks.push(file.replace('extension/js/chunks/', ''));
									} else if (file.endsWith('.css')) {
										cssChunks.push(file.replace('extension/css/chunks/', ''));
									}
								}
							}
							const manifest = `window.__EXTENSION_CHUNKS__ = ${JSON.stringify(jsChunks)};\nwindow.__EXTENSION_CSS__ = ${JSON.stringify(cssChunks)};`;
							compilation.emitAsset('extension/js/chunks/manifest.js', new rspack.sources.RawSource(manifest));
						}
						callback();
					});
				}
			},
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