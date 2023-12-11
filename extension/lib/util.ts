import { UtilData, UtilRouter, dispatcher } from 'Lib';
import { authStore } from 'Store';
import Extension from 'json/extension.json';

class Util {

	extensionId () {
		return Extension.clipper.id;
	};

	isExtension () {
		return (
			(location.protocol == 'chrome-extension:') && 
			(location.hostname == this.extensionId())
		);
	};

	isPopup () {
		return (
			this.isExtension() && 
			(location.pathname == '/popup/index.html')
		);
	};

	isIframe () {
		return (
			this.isExtension() && 
			(location.pathname == '/iframe/index.html')
		);
	};

	sendMessage (msg: any, callBack: (response) => void){
		/* @ts-ignore */
		chrome.runtime.sendMessage(msg, callBack);
	};

	getCurrentTab (callBack: (tab) => void) {
		/* @ts-ignore */
		chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => callBack(tabs[0]));
	};

	initWithToken (token: string) {
		authStore.tokenSet(token);
		dispatcher.listenEvents();
		UtilData.createsSubscriptions(() => UtilRouter.go('/create', {}));
	};
	
};

export default new Util();