const Util = require('./util.js');

exports.default = async function (context) {
	const cmd = [
		`npx sentry-cli`,
		`--url \"https://sentry.anytype.io\"`,
		`releases files \"${context.packager.appInfo.version}\"`,
		`upload-sourcemaps`,
		`../../dist/main.js.map`,
		`--org \"anytype\"`,
		`--project \"desktop\"`,
		`--log-level=debug`,
		`--auth-token ${process.env.SENTRY_AUTH_TOKEN}`
	].join(' ');

	return await Util.execPromise(cmd);
};