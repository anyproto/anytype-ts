'use strict';

const path = require('path');
const modulePath = path.join(__dirname, 'build', 'Release', 'win32_job.node');

module.exports = require(modulePath);
