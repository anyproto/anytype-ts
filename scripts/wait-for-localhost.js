#!/usr/bin/env node
'use strict';

const http = require('http');

const port = parseInt(process.argv[2] || '80', 10);
const interval = 500;

function check() {
	const req = http.request({ hostname: 'localhost', port, method: 'HEAD', path: '/', timeout: 1000 }, (res) => {
		process.exit(0);
	});
	req.on('error', () => setTimeout(check, interval));
	req.on('timeout', () => { req.destroy(); setTimeout(check, interval); });
	req.end();
}

check();
