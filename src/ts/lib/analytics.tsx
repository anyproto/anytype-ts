import * as amplitude from 'amplitude-js';

const Constant = require('json/constant.json');

class Analytics {
	
	isInit: boolean =  false;
	
	init () {
		console.log('[Analytics.init]', Constant.amplitude);
		amplitude.getInstance().init(Constant.amplitude);
		this.isInit = true;
	};
	
	profile (profile: any) {
		console.log('[Analytics.profile]', profile.id);
		amplitude.getInstance().setUserId(profile.id);
	};
	
	setUserProperties (obj: any) {
		console.log('[Analytics.setUserProperties]', obj);
		amplitude.getInstance().setUserProperties(obj);
	};
	
	event (code: string, param?: any) {
		if (!code || !this.isInit) {
			return;
		};
		
		param = param || {};
		
		console.log('[Analytics.event]', code, param);
		amplitude.getInstance().logEvent(code, param);
	};
	
};

export let analytics: Analytics = new Analytics();