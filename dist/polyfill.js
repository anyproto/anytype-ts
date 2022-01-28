let RendererEvents = {};

window.Config = {
    debug: {
        mw: true,
    },
};

window.Renderer = {
    send: function () {},
    removeAllListeners: function () {},
    on: function (id, callBack) {
        RendererEvents[id] = callBack;
    },
};

window.require = window.require || function (mod) {
    let ret = {};

    switch (mod) {
        case '@electron/remote':
            ret.app = {
                getVersion: function () { return ''; },
                getPath: function () { return ''; },
            };

            ret.process = {
                getSystemVersion: function () { return ''; },
            };

            ret.getGlobal = function (v) {
                switch (v) {
                    case 'serverAddr':
                        return window.serverAddr;
                };
            };
            break;

        case 'os':
            ret.platform = function () { return 'darwin'; };
            ret.release = function () { return ''; };
            break;

    };

    return ret;
};