const fs = require('fs');
const https = require('https');
const remoteConfigUrl = 'https://raw.githubusercontent.com/anyproto/open/main/compliance/licenses-config.json';

function processLicenses(licenses, allowedLicenses) {
	const disallowedPackages = Object.keys(licenses).filter(pkg => {
		let pkgLicenses = licenses[pkg].licenses.replace(/[()*]/g, '');
	
		// The hyphenation language patterns are licensed under the LGPL (unless otherwise noted) and copyrighted to their respective creators and maintainers.
		// https://github.com/bramstein/hyphenation-patterns
		if (pkg.startsWith('hyphenation.')) {
			pkgLicenses = 'LGPL';
		};

		// Solutions developed by Anytype or Any Association are allowed
		if (licenses[pkg].publisher == 'Anytype' || licenses[pkg].publisher == 'Any' || licenses[pkg].publisher == 'Any Association') {
			return false;
		};
		
		if (pkgLicenses.includes(' AND ')) {
			const licenseNames = pkgLicenses.split(' AND ');
			return !licenseNames.every(name => allowedLicenses.includes(name));
		};

		const licenseNames = pkgLicenses.split(' OR ');
		return !licenseNames.some(name => allowedLicenses.includes(name));
	});
	if (disallowedPackages.length > 0) {
		console.error('The following packages have disallowed licenses:');
		disallowedPackages.forEach(pkg => {
			console.error(`- ${pkg} (${licenses[pkg].licenses})`);
		});
		process.exit(1);
	} else {
		console.info('All packages have allowed licenses.');
	};
};

https.get(remoteConfigUrl, (res) => {
	let data = '';
	res.on('data', (chunk) => {
		data += chunk;
	});
	res.on('end', () => {
		const config = JSON.parse(data);
		const allowedLicenses = config.allowedLicenses;
		fs.readFile('./licenses.json', 'utf8', (err, data) => {
			if (err) throw err;
			const licenses = JSON.parse(data);
			processLicenses(licenses, allowedLicenses);
		});
	});
}).on('error', (err) => {
	console.error(`Error retrieving remote configuration: ${err}`);
	process.exit(1);
});