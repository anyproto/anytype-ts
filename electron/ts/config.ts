import { app } from 'electron';
import storage from 'electron-json-storage';
import Util from './util';

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

	config: Record<string, any> = {};

	init (callBack?: () => void) {
		storage.get(CONFIG_NAME, (error: any, data: any) => {
			this.config = data || {};

			if (undefined === this.config.showMenuBar) {
				this.config.showMenuBar = true;
			};

			if (undefined === this.config.alwaysShowTabs) {
				this.config.alwaysShowTabs = false;
			};

			if (undefined === this.config.hardwareAcceleration) {
				this.config.hardwareAcceleration = true;
			};

			this.checkChannel();
			this.checkTheme();

			console.log('[ConfigManager].init:', this.config);

			if (error) {
				console.error(error);
			};

			callBack?.();
		});
	};

	set (obj: Record<string, any>, callBack?: (error?: any) => void) {
		this.config = Object.assign(this.config, obj);
		this.checkChannel();
		this.checkTheme();

		console.log('[ConfigManager].set:', this.config);

		storage.set(CONFIG_NAME, this.config as any, (error: any) => {
			callBack?.(error);
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
		let channels = ChannelSettings.map((it) => {
			return { id: it.id, label: Util.translate(it.lang), type: 'radio' as const, checked: (this.config.channel == it.id) };
		});
		if (!this.config.sudo && !version.match('alpha')) {
			channels = channels.filter(it => it.id != 'alpha');
		};
		return channels;
	};

};

export default new ConfigManager();
