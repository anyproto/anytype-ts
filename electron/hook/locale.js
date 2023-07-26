
const https = require('https');
const path = require('path');
const fs = require('fs');

const Constant = require('../../src/json/constant.json');
const OWNER = 'anyproto';
const REPO = 'l10n-anytype-ts';
const PATH = '/locales';
const LANGS = Object.keys(Constant.interfaceLang);

const run = async () => {
	for (const lang of LANGS) {
		const content = await request(lang);
		const fp = path.join(__dirname, '..', '..', 'dist', 'lib', 'json', 'lang', `${lang}.json`);

		fs.writeFileSync(fp, content);
		console.log('Saved lang file:', fp);
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

	return new Promise((resolve, reject) => {
		const success = response => {
			response.on('data', d => str += d);
			response.on('end', function () {
				const data = JSON.parse(str);
				resolve(Buffer.from(data.content, 'base64').toString());
			});
		};

		const error = error => {
			console.log("Error: " + error.message);
			reject(error);
		};

		const req = https.request(options, success).on('error', error);

		req.end();
    });
};

run();