const path = require('path');

module.exports = {
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
    }
};