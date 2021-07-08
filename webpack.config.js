const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const proccess = require('process');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (env) => {
	const useGRPC = !process.env.ANYTYPE_USE_ADDON && (process.env.ANYTYPE_USE_GRPC || (process.platform == 'win32') || (env.NODE_ENV == 'development'));
	const port = env.SERVER_PORT;

	return {
		mode: env.NODE_ENV,
	
		//devtool: 'source-map',

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
						{ 
							loader: 'ifdef-loader', 
							options: {
								USE_GRPC: useGRPC,
								USE_ADDON: !useGRPC,
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

			function () {
				this.plugin('compilation', (stats) => {
					const dst = path.join(__dirname, 'electron', 'env.json');
					const content = {
						USE_GRPC: useGRPC
					};
					
					fs.writeFileSync(dst, JSON.stringify(content, null, 3));
				});
			},
		],
		externals: {
			bindings: 'require("bindings")'
		},
	};
};
