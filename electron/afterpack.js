const fs = require('fs');

exports.default = async function(context){
    const { electronPlatformName, arch } = context;

    console.log('Build AfterPack', electronPlatformName, arch);

	if (electronPlatformName !== 'darwin') {
		return;
	};

    fs.rmSync('./build', { recursive: true, force: true });
};