const { exec } = require('child_process');
const fs = require('fs');

class Util {

	execPromise (command) {
		return new Promise(function(resolve, reject) {
			exec(command, (error, stdout, stderr) => {
				console.log('Error: ', error, stderr);

				if (error || stderr) {
					reject(error || stderr);
					return;
				};

				console.log('Out: ', stdout.trim());

				resolve(stdout.trim());
			});
		});
	};

};

module.exports = new Util();