'use strict';

let nativeBindings = null;

if (process.platform === 'win32') {
	try {
		nativeBindings = require('@anytype/win32-job');
	} catch (err) {
		console.error('[WindowsJob] Failed to load native module', err);
	}
}

function createJob () {
	if (!nativeBindings) {
		return null;
	}

	return nativeBindings.createJob();
}

function assignProcess (jobHandle, pid) {
	if (!nativeBindings || !jobHandle) {
		return;
	}

	nativeBindings.assignProcess(jobHandle, pid);
}

function closeJob (jobHandle) {
	if (!nativeBindings || !jobHandle) {
		return;
	}

	nativeBindings.closeJob(jobHandle);
}

module.exports = {
	createJob,
	assignProcess,
	closeJob,
};
