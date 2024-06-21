
const https = require('https');
const path = require('path');
const fs = require('fs');

const Constant = require('../json/constant.json');
const OWNER = 'anyproto';
const REPO = 'l10n-anytype-ts';
const PATH = '/locales';
const LANGS = Constant.enabledLangs || [];

const run = async () => {
	for (const lang of LANGS) {
		const fp = path.join(__dirname, '..', '..', 'dist', 'lib', 'json', 'lang', `${lang}.json`);

		let content = '';
		if (lang == 'en-US') {
			content = JSON.stringify(require('../../src/json/text.json'), null, 4);
		} else {
			content = await request(lang).catch(e => console.log(e));
		};

		if (content) {
			fs.writeFileSync(fp, content);
			console.log('Saved lang file:', fp);
		};
	};
};

const request = async (lang) => {
	let str = '';

	const options = {
		hostname: 'api.github.com',
		path: `/repos/${OWNER}/${REPO}/contents/${PATH}/${lang}.json`,
		port: 443,
		method: 'GET',
		headers: {
			'Accept': 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
			'User-Agent': 'Chrome/59.0.3071.115',
		},
	};

	if (process.env.GITHUB_TOKEN) {
		options.headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
	};

	return new Promise((resolve, reject) => {
		const success = response => {
			response.on('data', d => str += d);
			response.on('end', function () {
				const data = JSON.parse(str);

				if (data.message) {
					reject(data.message);
				} else {
					resolve(Buffer.from(data.content, 'base64').toString());
				};
			});
		};

		const error = error => {
			console.log('Error: ' + error.message);
			reject(error);
		};

		const req = https.request(options, success).on('error', error);

		req.end();
    });
};

run();