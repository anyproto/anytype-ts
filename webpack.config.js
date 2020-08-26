const webpack = require('webpack');
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
				'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV),
			})
		],
		externals: {
			bindings: 'require("bindings")'
		},
	};
};
