import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { autoObserverPlugin } from './vite.auto-observer';
import path from 'path';

function stubSubpathPlugin(): Plugin {
	const stubs: Record<string, string> = {
		'prismjs': path.resolve(__dirname, 'src/stubs/prismjs.js'),
	};

	return {
		name: 'stub-subpath',
		enforce: 'pre',
		resolveId(source) {
			for (const [pkg, stub] of Object.entries(stubs)) {
				if (source === pkg || source.startsWith(pkg + '/')) {
					return stub;
				}
			}
			return null;
		},
	};
}

function extensionManifestPlugin(): Plugin {
	return {
		name: 'extension-manifest',
		generateBundle(_, bundle) {
			const jsChunks: string[] = [];
			const cssChunks: string[] = [];

			for (const [fileName, chunk] of Object.entries(bundle)) {
				if (fileName.endsWith('.js')) {
					jsChunks.push(fileName.replace('js/chunks/', ''));
				} else
				if (fileName.endsWith('.css')) {
					cssChunks.push(fileName.replace('css/chunks/', ''));
				}
			}

			const manifest = `window.__EXTENSION_CHUNKS__ = ${JSON.stringify(jsChunks)};\nwindow.__EXTENSION_CSS__ = ${JSON.stringify(cssChunks)};`;

			this.emitFile({
				type: 'asset',
				fileName: 'js/chunks/manifest.js',
				source: manifest,
			});
		},
	};
}

export default defineConfig({
	root: '.',
	publicDir: false,

	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx'],
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
			scss: path.resolve(__dirname, 'src/scss'),
			img: path.resolve(__dirname, 'src/img'),
			css: path.resolve(__dirname, 'dist/css'),
				Proto: path.resolve(__dirname, 'middleware'),
			// Stubs for heavy dependencies
			'@excalidraw/excalidraw': path.resolve(__dirname, 'src/stubs/excalidraw.js'),
			'@viz-js/viz': path.resolve(__dirname, 'src/stubs/viz.js'),
			'mermaid': path.resolve(__dirname, 'src/stubs/mermaid.js'),
			'amplitude-js': path.resolve(__dirname, 'src/stubs/amplitude.js'),
			'@sentry/browser': path.resolve(__dirname, 'src/stubs/sentry.js'),
			'd3': path.resolve(__dirname, 'src/stubs/d3.js'),
			'react-pdf': path.resolve(__dirname, 'src/stubs/pdfjs.js'),
			'pdfjs-dist': path.resolve(__dirname, 'src/stubs/pdfjs.js'),
			'katex$': path.resolve(__dirname, 'src/stubs/katex.js'),
			'katex/dist/contrib/mhchem': path.resolve(__dirname, 'src/stubs/katex.js'),
			'pako': path.resolve(__dirname, 'src/stubs/pako.js'),
		},
	},

	define: {
		'SPARK_ONBOARDING_URL': JSON.stringify(process.env.SPARK_ONBOARDING_URL || 'wss://stage1-anytype-spark.anytype.io'),
		'SPARK_ONBOARDING_TOKEN': JSON.stringify(process.env.SPARK_ONBOARDING_TOKEN || 'spark_92eabe0c7f006ff22b0d81f3974b355556756afd3262249e4a748076c4483869'),
		'SPARK_ONBOARDING_NO_AUTH': JSON.stringify(process.env.SPARK_ONBOARDING_NO_AUTH || 'false'),
		'SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN || 'https://44e6df81644c4e36b21b1dbea62b8a1a@sentry.anytype.io/3'),
		'process.env': '{}',
		'__IS_EXTENSION__': 'true',
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
	},

	build: {
		outDir: path.resolve(__dirname, 'dist/extension'),
		emptyOutDir: true,
		sourcemap: false,
		cssCodeSplit: true,
		commonjsOptions: {
			include: [/dist\/lib\//, /node_modules\//],
			transformMixedEsModules: true,
		},
		chunkSizeWarningLimit: 3000,
		minify: 'terser',
		terserOptions: {
			mangle: false,
			compress: true,
		},

		rollupOptions: {
			input: path.resolve(__dirname, 'extension/entry.tsx'),
			output: {
				entryFileNames: 'js/chunks/main.js',
				chunkFileNames: 'js/chunks/[name].js',
				assetFileNames: (assetInfo) => {
					if (assetInfo.names?.[0]?.endsWith('.css')) {
						return 'css/chunks/[name][extname]';
					}
					return 'assets/[name]-[hash][extname]';
				},
				manualChunks(id) {
					if (/dist[\\/]lib[\\/]pb[\\/]protos[\\/]commands_pb\.js/.test(id)) {
						return 'pb-commands';
					}
					if (/dist[\\/]lib[\\/]pb[\\/]protos[\\/]events_pb\.js/.test(id)) {
						return 'pb-events';
					}
					if (/dist[\\/]lib[\\/]pb[\\/]protos[\\/]models_pb\.js/.test(id)) {
						return 'pb-models';
					}
					if (id.includes('dist/lib/pb/')) {
						return 'protobuf';
					}
					if (/node_modules\/(react|react-dom|mobx|mobx-react)\//.test(id)) {
						return 'react';
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
		stubSubpathPlugin(),
		react(),
		autoObserverPlugin(),
		extensionManifestPlugin(),
	],
});
