import Extension from 'json/extension.json';

class Util {

	extensionId () {
		return Extension.clipper.id;
	};

	isPopup () {
		return (
			(location.protocol == 'chrome-extension:') && 
			(location.hostname == this.extensionId()) && 
			(location.pathname == '/popup/index.html')
		);
	};

};

export default new Util();