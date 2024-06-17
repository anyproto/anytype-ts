const RendererEvents = {};

window.AnytypeGlobalConfig = {
    debug: {
        mw: true,
    },
};

window.Electron = {
	platform: 'Windows',
	version: {
	},
	isMaximized: () => {},
	getGlobal: (v) => {
		switch (v) {
			case 'serverAddress':
				return window.serverAddress;
		};
	},
	removeAllListeners: function () {},
	on: function (id, callBack) {
        RendererEvents[id] = callBack;
		console.log(RendererEvents);
    },
	send: function () {},
	currentWindow: function () {
		return {};
	},
	Api: () => {},
};

window.require = window.require || function (mod) {
    const ret = {};

    switch (mod) {
        case '@electron/remote':
            ret.app = {
                getVersion: function () { return ''; },
                getPath: function () { return ''; },
            };

            ret.process = {
                getSystemVersion: function () { return ''; },
            };

            break;

        case 'os':
            ret.platform = function () { return 'darwin'; };
            ret.release = function () { return ''; };
            break;

    };

    return ret;
};