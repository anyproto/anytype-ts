const fs = require('fs-extra');

exports.default = async function (context) {
    const { platform, arch } = context;

    console.log('[BeforeBuild] platform:', platform.name, 'arch:', arch);

	let folder = '';
	if (platform.name == 'mac') {
		folder = `darwin-${arch == 'arm64' ? 'arm' : 'amd'}`;
	} else 
	if (platform.name == 'linux') {
		folder = `linux-${arch == 'arm64' ? 'arm' : 'amd'}`;
	};

	console.log('[BeforeBuild] folder:', folder);

	if (!folder) {
		return;
	};

	const files = [ 'anytypeHelper', 'anytypeHelper.exe' ];

	files.forEach(it => {
		const src = `./${folder}/${it}`;
		const dst = `./dist/${it}`;

		if (fs.existsSync(src)) {
			fs.copySync(src, dst);
			console.log('[BeforeBuild] copy', src, dst);
		};
	});
};