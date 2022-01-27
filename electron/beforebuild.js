const fs = require('fs')

exports.default = async function(context){
    const { platform, arch } = context;

    console.log('Build BeforeBuild', platform.name, arch);

	if (platform.name !== 'mac') {
		return;
	};

    const folder = arch == 'arm64' ? 'darwin-arm' : 'darwin-amd';
    fs.renameSync('./' + folder, './build', function (err) {});
};