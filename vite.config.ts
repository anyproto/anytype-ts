import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';
import fs from 'fs';
import { build as esbuild } from 'esbuild';

const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'));
const cMapsDir = path.join(pdfjsDistPath, 'cmaps');
const wasmDir = path.join(pdfjsDistPath, 'wasm');

export default defineConfig(({ mode }) => {
	const prod = mode === 'production';
	const port = parseInt(process.env.SERVER_PORT || '8080', 10);

	return {
		root: '.',
		base: prod ? './' : '/',
		publicDir: false,

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
						const relative = source;
						const srcPath = path.join(srcImgDir, relative);
						if (fs.existsSync(srcPath)) return srcPath;
						const distPath = path.join(distImgDir, relative);
						if (fs.existsSync(distPath)) return distPath;
						return srcPath; // fallback
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
		},

		css: {
			preprocessorOptions: {
				scss: {
					api: 'legacy',
					// Allow SCSS to resolve imports from src/scss
					includePaths: [path.resolve(__dirname, 'src/scss')],
					// Strip webpack-style ~ prefix from SCSS imports
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
			outDir: 'dist',
			emptyOutDir: false,
			sourcemap: false,
			cssCodeSplit: false,
			assetsInlineLimit: 10000000, // Inline all assets as base64
			commonjsOptions: {
				include: [/dist\/lib\//, /node_modules\//],
				transformMixedEsModules: true,
			},
			rollupOptions: {
				input: {
					main: path.resolve(__dirname, 'src/html/index.html'),
				},
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
						if (/node_modules\/(react|react-dom|scheduler|mobx|mobx-react|mobx-react-lite|use-sync-external-store|prop-types|hoist-non-react-statics|react-is|object-assign|loose-envify|js-tokens)\//.test(id)) {
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
						if (id.includes('node_modules/')) {
							return 'vendor';
						}
					},
				},
			},
		},

		plugins: [
			react(),
			protobufCjsPlugin(),
			devServerPlugin(),

			// Move index.html from dist/src/html/index.html to dist/index.html and fix paths
			{
				name: 'move-html',
				closeBundle() {
					const src = path.resolve(__dirname, 'dist/src/html/index.html');
					const dest = path.resolve(__dirname, 'dist/index.html');
					if (fs.existsSync(src)) {
						let html = fs.readFileSync(src, 'utf8');
						// Fix relative paths that were relative to src/html/
						html = html.replace(/(?:\.\.\/)+(?=js\/|css\/|assets\/)/g, './');
						fs.writeFileSync(dest, html);
						fs.unlinkSync(src);
						try { fs.rmdirSync(path.resolve(__dirname, 'dist/src/html')); } catch {}
						try { fs.rmdirSync(path.resolve(__dirname, 'dist/src')); } catch {}
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
			port,
			host: 'localhost',
			hmr: true,
		},
	};
});

const srcImgDir = path.resolve(__dirname, 'src/img');
const distImgDir = path.resolve(__dirname, 'dist/img');

/**
 * Transforms CJS protobuf files (dist/lib/pb/) to ESM in dev mode using esbuild.
 * Production builds use Rollup's commonjsOptions instead.
 */
function protobufCjsPlugin(): Plugin {
	const cache = new Map<string, { code: string; mtime: number }>();

	return {
		name: 'protobuf-cjs',
		enforce: 'pre',
		apply: 'serve',
		async load(id) {
			if (!id.includes('/dist/lib/') || !id.endsWith('.js')) return null;

			const stat = fs.statSync(id, { throwIfNoEntry: false });
			if (!stat) return null;

			const cached = cache.get(id);
			if (cached && cached.mtime === stat.mtimeMs) {
				return cached.code;
			}

			const code = fs.readFileSync(id, 'utf-8');
			if (!code.includes('require(') && !code.includes('module.exports') && !code.includes('exports.')) {
				return null;
			}

			const result = await esbuild({
				stdin: { contents: code, resolveDir: path.dirname(id), loader: 'js' },
				bundle: true,
				format: 'esm',
				write: false,
				platform: 'browser',
				logLevel: 'silent',
			});

			let esm = result.outputFiles[0].text;

			// esbuild outputs `export default require_xxx();` for CJS modules.
			// Replace with individual named exports so both default and named imports work.
			const defaultMatch = esm.match(/export\s+default\s+(require_\w+)\(\);/);
			if (defaultMatch) {
				const factory = defaultMatch[1];
				// Execute the factory to discover exported property names
				const wrappedCode = esm.replace(defaultMatch[0], `return ${factory}();`);
				try {
					const fn = new Function(wrappedCode);
					const cjsExports = fn();
					const keys = Object.keys(cjsExports || {});
					const namedExports = keys.map(k => `export var ${k} = __cjs_exports__.${k};`).join('\n');
					esm = esm.replace(
						defaultMatch[0],
						`var __cjs_exports__ = ${factory}();\nexport default __cjs_exports__;\n${namedExports}`
					);
				} catch {
					// Fallback: just keep the default export
					esm = esm.replace(
						defaultMatch[0],
						`var __cjs_exports__ = ${factory}();\nexport default __cjs_exports__;`
					);
				}
			}

			cache.set(id, { code: esm, mtime: stat.mtimeMs });
			return esm;
		},
	};
}

/**
 * Dev server plugin: rewrite /index.html to /src/html/index.html for Vite processing,
 * and serve static files from dist/ (tabs.html, workers, fonts, etc.) to match
 * the old rspack devServer.static: ['dist'] behavior.
 */
function devServerPlugin(): Plugin {
	return {
		name: 'dev-server-rewrites',
		configureServer(server) {
			// Serve static files from dist/ (tabs.html, workers/, font/, etc.)
			server.middlewares.use((req, res, next) => {
				if (!req.url) return next();

				// Rewrite /index.html to /src/html/index.html so Vite processes it
				if (req.url === '/index.html' || req.url === '/') {
					req.url = '/src/html/index.html';
					return next();
				}

				// Try to serve from dist/ for static files (tabs.html, workers, fonts, etc.)
				// Skip files that Vite should process through its pipeline (JS/TS modules)
				const urlPath = req.url.split('?')[0];
				if (urlPath.startsWith('/dist/lib/')) {
					return next();
				}
				const distPath = path.resolve(__dirname, 'dist', urlPath.slice(1));
				if (fs.existsSync(distPath) && fs.statSync(distPath).isFile()) {
					return res.end(fs.readFileSync(distPath));
				}

				next();
			});
		},
	};
}
