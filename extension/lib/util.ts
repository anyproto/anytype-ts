import { UtilData, dispatcher } from 'Lib';
import { authStore, commonStore, extensionStore } from 'Store';
const Extension = require('json/extension.json');

const INDEX_POPUP = '/popup/index.html';
const INDEX_IFRAME = '/iframe/index.html'

class Util {

	isExtension () {
		return (
			(location.protocol == 'chrome-extension:') && 
			Extension.clipper.ids.includes(location.hostname)
		);
	};

	isPopup () {
		return this.isExtension() && (location.pathname == INDEX_POPUP);
	};

	isIframe () {
		return this.isExtension() && (location.pathname == INDEX_IFRAME);
	};

	fromPopup (url: string) {
		return url.match(INDEX_POPUP);
	};

	fromIframe (url: string) {
		return url.match(INDEX_IFRAME);
	};

	sendMessage (msg: any, callBack: (response) => void) {
		/* @ts-ignore */
		chrome.runtime.sendMessage(msg, callBack);
	};

	getCurrentTab (callBack: (tab) => void) {
		/* @ts-ignore */
		chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => callBack(tabs[0]));
	};

	init (serverPort: string, gatewayPort: string) {
		extensionStore.serverPort = serverPort;
		extensionStore.gatewayPort = gatewayPort;

		dispatcher.init(`http://127.0.0.1:${serverPort}`);
		commonStore.gatewaySet(`http://127.0.0.1:${gatewayPort}`);
	};

	authorize (appKey: string, onSuccess?: () => void, onError?: (error) => void) {
		authStore.appKeySet(appKey);
		UtilData.createSession('', appKey, (message: any) => {
			if (message.error.code) {
				if (onError) {
					onError(message.error);
				};
				return;
			};

			if (message.accountId) {
				authStore.accountSet({ id: message.accountId });
			};
			
			if (onSuccess) {
				onSuccess();
			};
		});
	};

	optionMapper (it: any) {
		return it._empty_ ? null : { ...it, object: it };
	};
	
};

export default new Util();