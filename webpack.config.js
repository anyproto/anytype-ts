const webpack = require('webpack');
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const GitRevisionPlugin = new require('git-revision-webpack-plugin');
const gitRevision = new GitRevisionPlugin();

module.exports = (env) => {
	return {
		mode: 'development',
	
		devtool: 'source-map',
		
		entry: './src/ts/app.tsx',
	
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
			new webpack.DefinePlugin({
				'___ENV___': JSON.stringify(env.NODE_ENV),
				'___GIT_VERSION___': JSON.stringify(gitRevision.version()),
				'___GIT_COMMIT___': JSON.stringify(gitRevision.commithash()),
				'___GIT_BRANCH___': JSON.stringify(gitRevision.branch()),
				//'process.env.NODE_ENV': JSON.stringify('production'),
			}),
			
			/*
			new UglifyJsPlugin({
				sourceMap: false,
				uglifyOptions: {
					output: {
						comments: false
					}
				}
			})
			*/
		],
		externals: {
			bindings: 'require("bindings")'
		},
	};
};