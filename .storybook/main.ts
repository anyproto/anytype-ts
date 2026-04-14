import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';
import fs from 'fs';
import AutoImport from 'unplugin-auto-import/vite';

const srcImgDir = path.resolve(__dirname, '../src/img');
const distImgDir = path.resolve(__dirname, '../dist/img');

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.tsx'],
	addons: ['@storybook/addon-essentials'],
	framework: '@storybook/react-vite',

	viteFinal: async (config) => {
		config.resolve = config.resolve || {};
		config.resolve.extensions = ['.ts', '.tsx', '.js', '.jsx'];
		config.resolve.alias = [
			{ find: 'SbHelpers', replacement: path.resolve(__dirname, 'helpers') },
			{ find: 'dist', replacement: path.resolve(__dirname, '../dist') },
			{ find: 'protobuf', replacement: path.resolve(__dirname, '../dist/lib') },
			{ find: 'json', replacement: path.resolve(__dirname, '../src/json') },
			{ find: 'Lib', replacement: path.resolve(__dirname, '../src/ts/lib') },
			{ find: 'Store', replacement: path.resolve(__dirname, '../src/ts/store') },
			{ find: 'Component', replacement: path.resolve(__dirname, '../src/ts/component') },
			{ find: 'Interface', replacement: path.resolve(__dirname, '../src/ts/interface') },
			{ find: 'Model', replacement: path.resolve(__dirname, '../src/ts/model') },
			{ find: 'Docs', replacement: path.resolve(__dirname, '../src/ts/docs') },
			{ find: 'Hook', replacement: path.resolve(__dirname, '../src/ts/hook') },
			{ find: 'scss', replacement: path.resolve(__dirname, '../src/scss') },
			{ find: 'img', replacement: path.resolve(__dirname, '../src/img') },
			{ find: 'css', replacement: path.resolve(__dirname, '../dist/css') },
			{ find: 'Proto', replacement: path.resolve(__dirname, '../middleware') },
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
			{ find: '~font', replacement: path.resolve(__dirname, '../dist/font') },
			{ find: '~css', replacement: path.resolve(__dirname, '../dist/css') },
		];

		config.css = config.css || {};
		config.css.preprocessorOptions = config.css.preprocessorOptions || {};
		config.css.preprocessorOptions.scss = {
			api: 'legacy',
			includePaths: [path.resolve(__dirname, '../src/scss')],
			importer: [
				function (url: string) {
					if (url.startsWith('~')) {
						const stripped = url.slice(1);
						if (stripped.startsWith('./') || stripped.startsWith('../')) {
							return { file: stripped };
						}
						return { file: path.resolve(__dirname, '../src', stripped) };
					}
					return null;
				},
			],
		};

		config.define = {
			...config.define,
			'process.env': '{}',
		};

		config.plugins = config.plugins || [];
		config.plugins.push(
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
			})
		);

		return config;
	},
};

export default config;
