const storage = require('electron-json-storage');
const Util = require('./util.js');

const CONFIG_NAME = 'devconfig';

class ConfigManager {

	config = {};

	init (callBack) {
		storage.get(CONFIG_NAME, (error, data) => {
			this.config = data || {};
			this.config.channel = String(this.config.channel || Util.getDefaultChannel());

			if (error) {
				console.error(error);
			};

			Util.log('info', 'Config: ' + JSON.stringify(this.config, null, 3));

			if (callBack) {
				callBack();
			};
		});
	};

	set (obj, callBack) {
		this.config = Object.assign(this.config, obj);

		storage.set(CONFIG_NAME, this.config, (error) => {
			if (callBack) {
				callBack(error);
			};
		});
	};

};

module.exports = new ConfigManager();