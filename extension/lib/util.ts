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

};

export default new Util();