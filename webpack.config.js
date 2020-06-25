const webpack = require('webpack');
const path = require('path');
const proccess = require('process');

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (env) => {
	let useGRPC;
	if (process.env.ANYTYPE_USE_ADDON === "1") {
		useGRPC = false;
	} else 
	if (process.env.ANYTYPE_USE_GRPC === "1") {
		useGRPC = true;
	} else 
	if (process.platform === "win32" || env.NODE_ENV === "development") {
		// use grpc on windows by default, because addon is not supported
		// also use grpc on development environment by default
		useGRPC = true;
	} else {
		useGRPC = false;
	};
	
	const ifdef_opts = {
		USE_GRPC: useGRPC,
		USE_ADDON: !useGRPC,
		version: 3,
		'ifdef-verbose': true,
	};
	
	return {
		mode: env.NODE_ENV,
	
		//devtool: 'source-map',

		optimization: {
			minimize: false,
			removeAvailableModules: false,
    		removeEmptyChunks: false,
    		splitChunks: false,
		},
		
		entry: './src/ts/entry.tsx',
	
		resolve: {
			extensions: [ '.ts', '.tsx', '.js', '.jsx' ],
			modules: [
				path.resolve('./src/'),
				path.resolve('./dist/'),
				path.resolve('./node_modules')
			]
		},
		
		devServer: {
			hot: true,
			inline: true,
			contentBase: path.join(__dirname, 'dist'),
			historyApiFallback: true,
			watchOptions: {
				ignored: [
					path.resolve(__dirname, 'dist'),
					path.resolve(__dirname, 'node_modules')
				]
			}
		},
	
		module: {
			rules: [
				{
					test: /\.ts(x?)$/,
					exclude: /node_modules/,
					use: [
						{
							loader: 'ts-loader'
						},
						{ loader: "ifdef-loader", options: ifdef_opts }
					]
				},
				{
					enforce: 'pre',
					test: /\.js$/,
					loader: 'source-map-loader'
				},
				{
					test: /\.(eot|ttf|otf|woff|woff2)$/,
					loader: 'url-loader?name=[path][name].[ext]'
				},
				{
					test: /\.(jpe?g|png|gif|svg)$/,
					loader: 'url-loader?name=[path][name].[ext]'
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
			new webpack.DefinePlugin({
				'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV)
			})
		],
		externals: {
			bindings: 'require("bindings")'
		},
	};
};
