const SentryCli = require('@sentry/cli');
const cli = new SentryCli();

exports.default = async function (context) {
	if (process.env.ELECTRON_SKIP_SENTRY) {
		return;
	};

	cli.releases.options = {
		url: 'https://sentry.anytype.io',
		authToken: process.env.SENTRY_AUTH_TOKEN,
		logLevel: 'debug',
		org: 'anytype',
		project: 'desktop',
		silent: false,
	};

	return await cli.releases.uploadSourceMaps(context.packager.appInfo.version, { 
		include: [ '../../dist/js/main.js.map' ],
	});
};