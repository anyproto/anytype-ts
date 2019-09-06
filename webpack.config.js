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
                loader: 'url-loader?name=public/fonts/[name].[ext]'
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

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    /*
    externals: {
        'react': 'React',
        'react-dom': 'ReactDOM'
    }
    */
};