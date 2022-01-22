let RendererEvents = {};

window.Config = {
    debug: {
        mw: true,
    }
};

window.Renderer = {
    send: function () {},
    removeAllListeners: function () {},
    on: function (id, callBack) {
        RendererEvents[id] = callBack;

        console.log(RendererEvents);
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
                        return 'http://127.0.0.1:61266';
                        break;
                };
            };
            break;

        case 'os':
            ret.platform = function () { return 'darwin'; };
            ret.release = function () {};
            break;

    };

    return ret;
};