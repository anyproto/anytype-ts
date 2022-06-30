const { app } = require('electron');
const storage = require('electron-json-storage');
const version = app.getVersion();

const CONFIG_NAME = 'devconfig';

class ConfigManager {

	config = {};

	init (callBack) {
		storage.get(CONFIG_NAME, (error, data) => {
			this.config = data || {};
			this.config.channel = String(this.config.channel || this.getDefaultChannel());

			if (error) {
				console.error(error);
			};

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

	getDefaultChannel () {
		let c = 'latest';
		if (version.match('alpha')) {
			c = 'alpha';
		};
		if (version.match('beta')) {
			c = 'beta';
		};
		return c;
	};

};

module.exports = new ConfigManager();