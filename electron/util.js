const log = require('electron-log');

log.transports.rendererConsole.level = 'error';

class Util {

    log (method, text) {
        if (!log[method]) {
            method = 'info';
        };
        log[method](text);
        console.log(text);
    };

};

module.exports = new Util();