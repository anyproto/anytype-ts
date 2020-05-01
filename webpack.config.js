const webpack = require('webpack');
const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (env) => {
	return {
		mode: env.NODE_ENV,
	
		devtool: 'source-map',
		
		entry: './src/ts/entry.tsx',
	
		resolve: {
			extensions: [ '.ts', '.tsx', '.js', '.jsx' ],
			modules: [
				path.resolve('./src/'),
				path.resolve('./node_modules')
			]
		},
		
		devServer: {
			hot: true,
			inline: true,
			contentBase: path.join(__dirname, 'dist'),
			historyApiFallback: true
		},
	
		module: {
			rules: [
				{
					test: /\.ts(x?)$/,
					exclude: /node_modules/,
					use: [
						{
							loader: 'ts-loader'
						}
					]
				},
				{
					test: /\.js$/,
					exclude: /node_modules/,
					use: [
						{
							loader: 'babel-loader',
							query: { presets:[ 'env' ] }
						}
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
					test: /\.(s?)css$/,
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