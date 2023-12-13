import { UtilData, UtilRouter } from 'Lib';
import { authStore, extensionStore } from 'Store';
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

	sendMessage (msg: any, callBack: (response) => void) {
		/* @ts-ignore */
		chrome.runtime.sendMessage(msg, callBack);
	};

	getCurrentTab (callBack: (tab) => void) {
		/* @ts-ignore */
		chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => callBack(tabs[0]));
	};

	initWithKey (appKey: string, onError?: (error) => void) {
		const { serverPort, gatewayPort } = extensionStore

		authStore.appKeySet(appKey);
		UtilData.createSession((message: any) => {
			if (message.error.code) {
				if (onError) {
					onError(message.error);
				};
				return;
			};

			this.sendMessage({ 
				type: 'init', 
				appKey,
				serverPort,
				gatewayPort,
			}, () => {});

			UtilData.createsSubscriptions(() => UtilRouter.go('/create', {}));
		});
	};
	
};

export default new Util();