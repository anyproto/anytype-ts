'use strict';

const fs = require('fs');

let stdin = process.openStdin();
let data = "";

stdin.on('data', function(chunk) {
	data +=chunk;
});

stdin.on('end', function() {
	let lines = data.split('\n');
	let baseDepsFile = fs.readFileSync('package.deps.json');
	let baseDepsJSON = JSON.parse(baseDepsFile);
	let packageFile = fs.readFileSync('package.json');
	let packageJSON = JSON.parse(packageFile);
	
	packageJSON.build.files = baseDepsJSON.concat(lines).filter(function (el) {
		return el != "";
	});
	let jsonS = JSON.stringify(packageJSON, null, '\t');
	fs.writeFileSync('package.json', jsonS);
});



