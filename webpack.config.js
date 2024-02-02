const path = require('path');
const process = require('process');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const port = process.env.SERVER_PORT;

const mode = 'development';
const devtool = 'source-map';
const optimization = {
	minimize: false,
	removeAvailableModules: true,
	removeEmptyChunks: true,
	splitChunks: false,
};

const resolve = {
	extensions: [ '.ts', '.tsx', '.js', '.jsx' ],
	alias: {
		dist: path.resolve(__dirname, 'dist'),
		json: path.resolve(__dirname, 'src/json'),
		Store: path.resolve(__dirname, 'src/ts/store'),
		Component: path.resolve(__dirname, 'src/ts/component'),
		Interface: path.resolve(__dirname, 'src/ts/interface'),
		Model: path.resolve(__dirname, 'src/ts/model'),
		Docs: path.resolve(__dirname, 'src/ts/docs'),
	},
	modules: [
		path.resolve('./src/'),
		path.resolve('./electron/'),
		path.resolve('./dist/'),
		path.resolve('./node_modules'),
	],
};

const devServer = {
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
	},
};

const loaders = {
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
};

const plugins = [
	//new BundleAnalyzerPlugin(),
	new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
];

module.exports = [

	(env, argv) => {
		return {
			mode,
			devtool,
			optimization,
			devServer,
			
			entry: './src/ts/entry.tsx',
			output: {
				filename: 'main.js',
			},

			resolve: Object.assign(resolve, {
				alias: Object.assign(resolve.alias, {
					Lib: path.resolve(__dirname, 'src/extension/lib'),
				}),
			}),

			module: loaders,
			plugins,
		};
	},

	(env, argv) => {
		return {
			mode,
			devtool,
			optimization,
			devServer,

			entry: './extension/entry.tsx',
			output: {
				filename: 'extension/js/main.js',
			},

			resolve: Object.assign(resolve, {
				alias: Object.assign(resolve.alias, {
					Lib: path.resolve(__dirname, 'src/ts/lib'),
				}),
			}),

			module: loaders,
			plugins,
		};
	},

];