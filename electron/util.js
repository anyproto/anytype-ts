const log = require('electron-log');

log.transports.rendererConsole.level = 'error';

console.log(log);

class Util {

    log (method, text) {
        if (!log[method]) {
            method = 'info';
        };
        log[method](text);
    }

};

module.exports = new Util();