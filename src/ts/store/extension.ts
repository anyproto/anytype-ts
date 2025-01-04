import { makeObservable, observable, action } from 'mobx';

class ExtensionStore {

	public createdObject = null;
	public serverPort = '';
	public gatewayPort = '';
	public tabUrlValue = '';
	public htmlValue = '';

	constructor() {
		makeObservable(this, {
			htmlValue: observable,
			setHtml: action,
		});
	};

	get html (): string {
		return String(this.htmlValue || '');
	};

	get tabUrl (): string {
		return String(this.tabUrlValue || '');
	};

	setHtml (v: string) {
		this.htmlValue = String(v || '');
	};

	setTabUrl (v: string) {
		this.tabUrlValue = String(v || '');
	};

};

export const Extension: ExtensionStore = new ExtensionStore();