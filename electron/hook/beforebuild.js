const fs = require('fs')

exports.default = async function(context){
    const { platform, arch } = context;

    console.log('Build BeforeBuild', platform.name, arch);
	let folder = "";
	if (platform.name == 'mac') {
		folder = arch == 'arm64' ? 'darwin-arm' : 'darwin-amd';
	} else if (platform.name == 'linux') {
		folder = arch == 'arm64' ? 'linux-arm' : 'linux-amd';
	} else {
		return
	}

	if (fs.existsSync('./' + folder)) {
		fs.renameSync('./' + folder, './build', function (err) {
		});
	} else {
		console.log('arch-specific folder not found');
	}
};