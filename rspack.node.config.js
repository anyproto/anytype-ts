const rspack = require('@rspack/core');

module.exports = (env) => {
	return {
		target: 'node',
		mode: 'production',
		optimization: {
			minimize: false,
			removeAvailableModules: false,
			removeEmptyChunks: false,
			splitChunks: false,
		},
		
		entry: './electron.js',
		output: {
			filename: 'bundle-back.js'
		},

		module: {
			rules: [
				{ test: /\.node$/, loader: 'node-loader' },
			]
		},

		plugins: [
			new rspack.IgnorePlugin({
				resourceRegExp: /osx-temperature-sensor/,
			}),
		],

		stats: 'detailed',
	};
};