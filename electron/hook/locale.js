const https = require('https');
const path = require('path');
const fs = require('fs');

const Constant = require('../json/constant.json');
const OWNER = 'anyproto';
const REPO = 'l10n-anytype-ts';
const PATH = '/locales';
const LANGS = Constant.enabledLangs || [];
const MAX_RETRIES = 3; // number of retries
const RETRY_DELAY = 1000; // delay in ms

const run = async () => {
	for (const lang of LANGS) {
		const fp = path.join(__dirname, '..', '..', 'dist', 'lib', 'json', 'lang', `${lang}.json`);

		let content = '';
		if (lang === 'en-US') {
			content = JSON.stringify(require('../../src/json/text.json'), null, 4);
		} else {
			content = await requestWithRetry(lang, MAX_RETRIES, RETRY_DELAY);
		};

		if (content) {
			fs.writeFileSync(fp, content);
			console.log('Saved lang file:', fp);
		};
	};
};

const requestWithRetry = async (lang, retries, delay) => {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			return await request(lang);
		} catch (err) {
			console.log(`Attempt ${attempt} failed for ${lang}: ${err}`);
			if (attempt < retries) {
				await new Promise(res => setTimeout(res, delay));
				console.log(`Retrying ${lang}...`);
			} else {
				console.log(`All ${retries} attempts failed for ${lang}`);
				return null;
			};
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
			response.on('end', () => {
				const data = JSON.parse(str);
				if (data.message) {
					reject(data.message);
				} else {
					resolve(Buffer.from(data.content, 'base64').toString());
				};
			});
		};

		const error = error => {
			reject(error);
		};

		const req = https.request(options, success).on('error', error);
		req.end();
	});
};

run();