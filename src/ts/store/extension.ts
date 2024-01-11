import { makeObservable, observable, action, computed } from 'mobx';

class ExtensionStore {

	public createdObject = null;
	public challengeId = '';
	public serverPort = '';
	public gatewayPort = '';
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

	setHtml (v: string) {
		this.htmlValue = String(v || '');
	};

};

export const extensionStore: ExtensionStore = new ExtensionStore();