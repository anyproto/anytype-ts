import { makeObservable, observable, action, computed } from 'mobx';

class ExtensionStore {

	public createdObject = null;
	public challengeId = '';
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

export const extensionStore: ExtensionStore = new ExtensionStore();