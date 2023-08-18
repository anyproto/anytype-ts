import Constant from 'json/constant.json';

class Util {

	extensionId () {
		return Constant.extension.clipper.id;
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