'use strict';

const fs = require('fs');

let stdin = process.openStdin();
let data = "";

stdin.on('data', function(chunk) {
	data +=chunk;
});

let skipIds = [ 'electron' ];

stdin.on('end', function() {
	let lines = data.split('\n').sort();
	let baseDepsFile = fs.readFileSync('package.deps.json');
	let baseDepsJSON = JSON.parse(baseDepsFile);
	let packageFile = fs.readFileSync('package.json');
	let packageJSON = JSON.parse(packageFile);

	lines = [ ...new Set(lines) ];
	lines = lines.filter((el) => { 
		return el && el.match(/^node_modules/) && !el.match(new RegExp(`^node_modules/(${skipIds.join('|')})$`)); 
	}).map((it) => { return { from: it, to: it }; });

	console.log(lines);

	packageJSON.build.files = baseDepsJSON.concat(lines);
	let jsonS = JSON.stringify(packageJSON, null, '\t');
	fs.writeFileSync('package.json', jsonS);
});