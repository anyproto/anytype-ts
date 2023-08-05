const SentryCli = require('@sentry/cli');
const cli = new SentryCli();

exports.default = async function (context) {
	cli.releases.options = {
		url: 'https://sentry.anytype.io',
		authToken: process.env.SENTRY_AUTH_TOKEN,
		logLevel: 'debug',
		org: 'anytype',
		project: 'desktop',
		silent: false,
	};

	return await cli.releases.uploadSourceMaps(context.packager.appInfo.version, { 
		include: [ '../../dist/main.js.map' ],
	});
};