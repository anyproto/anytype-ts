const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const process = require('process');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (env) => {
	const port = process.env.SERVER_PORT;

	return {
		mode: env.NODE_ENV,
	
		//devtool: 'source-map',

		target: 'electron-renderer',

		optimization: {
			minimize: false,
			removeAvailableModules: false,
    		removeEmptyChunks: true,
    		splitChunks: false,
		},
		
		entry: './src/ts/entry.tsx',
	
		resolve: {
			extensions: [ '.ts', '.tsx', '.js', '.jsx' ],
			modules: [
				path.resolve('./src/'),
				path.resolve('./electron/'),
				path.resolve('./dist/'),
				path.resolve('./node_modules')
			]
		},
		
		devServer: {
			hot: true,
			inline: true,
			contentBase: path.join(__dirname, 'dist'),
			historyApiFallback: true,
			host: 'localhost',
			port: port,
			watchOptions: {
				ignored: [
					path.resolve(__dirname, 'dist'),
					path.resolve(__dirname, 'node_modules')
				],
			},
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
						{ 
							loader: 'ifdef-loader', 
							options: {
								version: 3,
								'ifdef-verbose': true,
							},
						},
					]
				},
				{ test: /\.node$/, loader: 'node-loader' },
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
		plugins: [
			//new BundleAnalyzerPlugin(),
			new webpack.DefinePlugin({
				'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV),
			}),
		],
		externals: {
			bindings: 'require("bindings")'
		},
	};
};
