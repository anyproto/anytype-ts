'use strict';

const fs = require('fs');
const stdin = process.openStdin();

let data = '';
stdin.on('data', (chunk) => {
	data +=chunk;
});

const skipIds = [ 'electron' ];

stdin.on('end', function() {
	let lines = data.split('\n').sort();
	const baseDepsFile = fs.readFileSync('package.deps.json');
	const baseDepsJSON = JSON.parse(baseDepsFile);
	const packageFile = fs.readFileSync('package.json');
	const packageJSON = JSON.parse(packageFile);

	lines = [ ...new Set(lines) ];
	lines = lines.filter((el) => { 
		return el && el.match(/^node_modules/) && !el.match(new RegExp(`^node_modules/(${skipIds.join('|')})$`)); 
	}).map((it) => { 
		it = it.replace(/\\/g, '/');
		return { from: it, to: it }; 
	});

	console.log(lines);

	packageJSON.build.files = baseDepsJSON.concat(lines);
	const jsonS = JSON.stringify(packageJSON, null, '\t');
	fs.writeFileSync('package.json', jsonS);
});