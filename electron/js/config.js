const { app } = require('electron');
const storage = require('electron-json-storage');
const version = app.getVersion();

const ChannelSettings = [
	{ id: 'alpha', lang: 'electronChannelAlpha' },
	{ id: 'beta', lang: 'electronChannelBeta' },
	{ id: 'latest', lang: 'electronChannelLatest' },
];

const CONFIG_NAME = 'devconfig';
const LATEST = 'latest';
const BETA = 'beta';
const ALPHA = 'alpha';

class ConfigManager {

	config = {};

	init (callBack) {
		storage.get(CONFIG_NAME, (error, data) => {
			this.config = data || {};

			if (undefined === this.config.showMenuBar) {
				this.config.showMenuBar = true;
			};

			this.checkChannel();
			this.checkTheme();

			console.log('[ConfigManager].init:', this.config);

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
		this.checkChannel();
		this.checkTheme();

		console.log('[ConfigManager].set:', this.config);

		storage.set(CONFIG_NAME, this.config, (error) => {
			if (callBack) {
				callBack(error);
			};
		});
	};

	checkTheme () {
		this.config.theme = (undefined !== this.config.theme) ? this.config.theme : 'system';
	};

	checkChannel () {
		const channelIds = this.getChannels().map(it => it.id);

		this.config.channel = String(this.config.channel || this.getDefaultChannel());
		if (!channelIds.includes(this.config.channel)) {
			this.config.channel = LATEST;
		};
	};

	getDefaultChannel () {
		let c = LATEST;
		if (version.match('alpha')) {
			c = ALPHA;
		};
		if (version.match('beta')) {
			c = BETA;
		};
		return c;
	};

	getChannels () {
		const Util = require('./util.js');

		let channels = ChannelSettings.map((it) => {
			return { id: it.id, label: Util.translate(it.lang), type: 'radio', checked: (this.config.channel == it.id) };
		});
		if (!this.config.sudo && !version.match('alpha')) {
			channels = channels.filter(it => it.id != 'alpha');
		};
		return channels;
	};

};

module.exports = new ConfigManager();