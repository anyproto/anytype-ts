const fs = require('fs');

function copy (oldPath, newPath, callback) {
	const readStream = fs.createReadStream(oldPath);
	const writeStream = fs.createWriteStream(newPath);

	readStream.on('error', callback);
	readStream.pipe(writeStream);

	writeStream.on('error', callback);
	writeStream.on('close', function () { callback(); });
};

exports.default = async function (context) {
    const { platform, arch } = context;

    console.log('Build BeforeBuild', platform.name, arch);
	let folder = '';

	if (platform.name == 'mac') {
		folder = arch == 'arm64' ? 'darwin-arm' : 'darwin-amd';
	} else 
	if (platform.name == 'linux') {
		folder = arch == 'arm64' ? 'linux-arm' : 'linux-amd';
	} else {
		return;
	};

	if (fs.existsSync('./' + folder)) {
		copy('./' + folder, './dist', () => {});
	} else {
		console.log('arch-specific folder not found');
	};
};