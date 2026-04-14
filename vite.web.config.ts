import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import AutoImport from 'unplugin-auto-import/vite';
import { autoObserverPlugin } from './vite.auto-observer';
import path from 'path';
import fs from 'fs';
import os from 'os';

const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'));
const cMapsDir = path.join(pdfjsDistPath, 'cmaps');
const wasmDir = path.join(pdfjsDistPath, 'wasm');

const srcImgDir = path.resolve(__dirname, 'src/img');
const distImgDir = path.resolve(__dirname, 'dist/img');

function spaFallbackPlugin(): Plugin {
	return {
		name: 'spa-fallback',
		configureServer(server) {
			// Return function so this runs AFTER Vite's internal middleware
			return () => {
				server.middlewares.use(async (req, res, next) => {
					const url = req.url || '';
					const pathname = url.split('?')[0];

					if (
						pathname.startsWith('/@') ||
						pathname.startsWith('/node_modules/') ||
						pathname.startsWith('/src/') ||
						pathname.startsWith('/dist/') ||
						pathname.startsWith('/api/') ||
						pathname.startsWith('/cmaps/') ||
						pathname.startsWith('/wasm/')
					) {
						return next();
					}

					const htmlPath = path.resolve(__dirname, 'dist/index.web.html');

					if (!fs.existsSync(htmlPath)) {
						return next();
					}

					try {
						const raw = fs.readFileSync(htmlPath, 'utf-8');
						const html = await server.transformIndexHtml(
							'/dist/index.web.html',
							raw,
							req.originalUrl
						);

						res.statusCode = 200;
						res.setHeader('Content-Type', 'text/html');
						res.end(html);
					} catch (err) {
						console.error('[SPA Fallback] Error:', err);
						next(err);
					}
				});
			};
		},
	};
}

function webUploadPlugin(): Plugin {
	const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

	return {
		name: 'web-upload',
		configureServer(server) {
			const uploadDir = path.join(os.tmpdir(), 'anytype-web-uploads');
			if (!fs.existsSync(uploadDir)) {
				fs.mkdirSync(uploadDir, { recursive: true });
			}

			const sanitizeFilename = (filename: string) => {
				return String(filename || 'file')
					.replace(/[/\\:\x00]/g, '_')
					.replace(/^\.+/, '_');
			};

			server.middlewares.use('/api/web-upload', (req, res) => {
				if (req.method !== 'POST') {
					res.statusCode = 405;
					res.end(JSON.stringify({ error: 'Method not allowed' }));
					return;
				}

				const chunks: Buffer[] = [];
				let totalSize = 0;

				req.on('data', (chunk: Buffer) => {
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
						const { filename, content } = body;

						if (!filename || !content) {
							res.statusCode = 400;
							res.end(JSON.stringify({ error: 'Missing filename or content' }));
							return;
						}

						const buffer = Buffer.from(content, 'base64');

						if (buffer.length > MAX_FILE_SIZE) {
							res.statusCode = 413;
							res.end(JSON.stringify({ error: 'File too large' }));
							return;
						}

						const safeName = sanitizeFilename(filename);
						const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${safeName}`;
						const filePath = path.join(uploadDir, uniqueName);

						await fs.promises.writeFile(filePath, buffer);
						console.log('[Web Upload] File saved:', filePath);

						res.setHeader('Content-Type', 'application/json');
						res.end(JSON.stringify({ path: filePath }));
					} catch (e: any) {
						console.error('[Web Upload] Error:', e);
						res.statusCode = 500;
						res.end(JSON.stringify({ error: e.message }));
					}
				});
			});
		},
	};
}

export default defineConfig(({ mode }) => {
	const webPort = parseInt(process.env.WEB_PORT || '3030', 10);

	return {
		base: '/',
		root: '.',
		publicDir: false,
		appType: 'mpa',

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
				{ find: 'scss', replacement: path.resolve(__dirname, 'src/scss') },
				{ find: 'img', replacement: path.resolve(__dirname, 'src/img') },
				{ find: 'css', replacement: path.resolve(__dirname, 'dist/css') },
				{ find: 'Proto', replacement: path.resolve(__dirname, 'middleware') },
				{ find: 'mermaid', replacement: path.resolve(__dirname, 'node_modules/mermaid/dist/mermaid.esm.mjs') },
				// ~img/ URLs: check src/img first, fallback to dist/img
				{
					find: /^~img\//,
					replacement: '',
					customResolver(source) {
						const srcPath = path.join(srcImgDir, source);
						if (fs.existsSync(srcPath)) return srcPath;
						const distPath = path.join(distImgDir, source);
						if (fs.existsSync(distPath)) return distPath;
						return srcPath;
					},
				},
				{ find: '~font', replacement: path.resolve(__dirname, 'dist/font') },
				{ find: '~css', replacement: path.resolve(__dirname, 'dist/css') },
			],
		},

		define: {
			'SPARK_ONBOARDING_URL': JSON.stringify(process.env.SPARK_ONBOARDING_URL || 'wss://stage1-anytype-spark.anytype.io'),
			'SPARK_ONBOARDING_TOKEN': JSON.stringify(process.env.SPARK_ONBOARDING_TOKEN || 'spark_92eabe0c7f006ff22b0d81f3974b355556756afd3262249e4a748076c4483869'),
			'SPARK_ONBOARDING_NO_AUTH': JSON.stringify(process.env.SPARK_ONBOARDING_NO_AUTH || 'false'),
			'SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN || 'https://44e6df81644c4e36b21b1dbea62b8a1a@sentry.anytype.io/3'),
			'process.env': '{}',
			'__IS_WEB__': 'true',
		},

		css: {
			preprocessorOptions: {
				scss: {
					api: 'legacy',
					includePaths: [path.resolve(__dirname, 'src/scss')],
					importer: [
						function(url: string) {
							if (url.startsWith('~')) {
								const stripped = url.slice(1);
								if (stripped.startsWith('./') || stripped.startsWith('../')) {
									return { file: stripped };
								}
								return { file: path.resolve(__dirname, 'src', stripped) };
							}
							return null;
						},
					],
				},
			},
			postcss: {},
		},

		build: {
			outDir: 'dist-web',
			emptyOutDir: true,
			sourcemap: false,
			cssCodeSplit: false,
			assetsInlineLimit: 10000000,
			commonjsOptions: {
				include: [/dist\/lib\//, /node_modules\//],
				transformMixedEsModules: true,
			},

			rollupOptions: {
				input: path.resolve(__dirname, 'dist/index.web.html'),
				output: {
					entryFileNames: 'js/main.js',
					chunkFileNames: 'js/chunks/[name].js',
					assetFileNames: (assetInfo) => {
						if (assetInfo.names?.[0]?.endsWith('.css')) {
							return 'css/[name][extname]';
						}
						return 'assets/[name]-[hash][extname]';
					},
					manualChunks(id) {
						if (id.includes('dist/lib/pb/')) {
							return 'protobuf';
						}
						if (/node_modules\/(react|react-dom|scheduler|mobx|mobx-react)\//.test(id)) {
							return 'vendor-react';
						}
						if (/node_modules\/(d3|d3-[a-z-]+|internmap|delaunator|robust-predicates)\//.test(id)) {
							return 'vendor-d3';
						}
						if (/node_modules\/(mermaid|@mermaid-js|elkjs|cytoscape|cytoscape-[a-z-]+|cose-base|layout-base|avsdf-base|roughjs|dagre|graphlib|path-data-parser|points-on-curve|points-on-path)\//.test(id)) {
							return 'vendor-mermaid';
						}
						if (/node_modules\/@sentry\//.test(id)) {
							return 'vendor-sentry';
						}
						if (/node_modules\/@excalidraw\//.test(id)) {
							return 'vendor-excalidraw';
						}
						// Prism language components must stay as lazy chunks to preserve
						// dependency-ordered loading — don't merge into vendor
						if (/node_modules\/prismjs\/components\//.test(id)) {
							return;
						}
						if (id.includes('node_modules/')) {
							return 'vendor';
						}
					},
				},
			},
		},

		optimizeDeps: {
			include: [
				'dist/lib/pb/protos/commands_pb.js',
				'dist/lib/pb/protos/events_pb.js',
				'dist/lib/pkg/lib/pb/model/protos/models_pb.js',
				'google-protobuf',
				'grpc-web',
			],
		},

		plugins: [
			spaFallbackPlugin(),
			react(),
			autoObserverPlugin(),
			webUploadPlugin(),

			AutoImport({
				imports: [
					{
						'Store':     [['*', 'S']],
						'Hook':      [['*', 'H']],
						'json':      [['*', 'J']],
					},
					{
						'Lib/api/command':             [['*', 'C']],
						'Lib/util':                    [['*', 'U']],
						'Lib/keyboard':                [['keyboard', 'keyboard'], ['Key', 'Key']],
						'Lib/sidebar':                 [['sidebar', 'sidebar']],
						'Lib/mark':                    [['default', 'Mark']],
						'Lib/relation':                [['default', 'Relation']],
						'Lib/dataview':                [['default', 'Dataview']],
						'Lib/scrollOnMove':            [['scrollOnMove', 'scrollOnMove']],
						'Lib/analytics':               [['analytics', 'analytics']],
						'Lib/action':                  [['default', 'Action']],
						'Lib/onboarding':              [['default', 'Onboarding']],
						'Lib/survey':                  [['default', 'Survey']],
						'Lib/preview':                 [['default', 'Preview']],
						'Lib/translate':               [['translate', 'translate']],
						'Lib/sound':                   [['default', 'Sound'], ['SYSTEM_SOUND_ID', 'SYSTEM_SOUND_ID']],
						'Lib/renderer':                [['default', 'Renderer']],
						'Lib/api/dispatcher':          [['dispatcher', 'dispatcher']],
						'Lib/api/mapper':              [['Mapper', 'Mapper']],
						'Lib/api/struct':              [['Encode', 'Encode'], ['Decode', 'Decode']],
						'Lib/service/sparkOnboarding': [['getSparkOnboardingService', 'getSparkOnboardingService']],
					},
				],
				dts: false,
				include: [/\.tsx?$/],
				exclude: [
					/node_modules/,
					/src\/ts\/lib\/index\.ts$/,
					/src\/ts\/store\/index\.ts$/,
					/src\/ts\/interface\/index\.ts$/,
					/src\/ts\/model\/index\.ts$/,
					/src\/ts\/component\/index\.ts$/,
				],
			}),

			// Move index.web.html from dist-web/dist/ to dist-web/ and fix paths
			{
				name: 'move-html',
				closeBundle() {
					const src = path.resolve(__dirname, 'dist-web/dist/index.web.html');
					const dest = path.resolve(__dirname, 'dist-web/index.html');
					if (fs.existsSync(src)) {
						let html = fs.readFileSync(src, 'utf8');
						html = html.replace(/(?:\.\.\/)+(?=js\/|css\/|assets\/)/g, '/');
						fs.writeFileSync(dest, html);
						fs.unlinkSync(src);
						try { fs.rmdirSync(path.resolve(__dirname, 'dist-web/dist')); } catch {}
					}
				},
			} as Plugin,

			viteStaticCopy({
				targets: [
					{ src: path.join(cMapsDir, '*'), dest: 'cmaps' },
					{ src: path.join(wasmDir, '*'), dest: 'wasm' },
				],
			}),
		],

		server: {
			port: webPort,
			host: '0.0.0.0',
			hmr: true,
			cors: true,
		},
	};
});
