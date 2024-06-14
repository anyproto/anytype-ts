const { exec } = require('child_process');

class Util {

	execPromise (command) {
		return new Promise(function(resolve, reject) {
			exec(command, (error, stdout, stderr) => {
				const out = String(stdout || '').trim();

				console.log('Error: ', error, stderr);
				console.log('Out: ', out);

				if (error || stderr) {
					reject(error || stderr);
					return;
				};

				resolve(out);
			});
		});
	};

};

module.exports = new Util();