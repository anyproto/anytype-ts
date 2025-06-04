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

	/**
	 * Gets the HTML value.
	 * @private
	 * @returns {string} The HTML value.
	 */
	get html (): string {
		return String(this.htmlValue || '');
	};

	/**
	 * Gets the tab URL value.
	 * @private
	 * @returns {string} The tab URL value.
	 */
	get tabUrl (): string {
		return String(this.tabUrlValue || '');
	};

	/**
	 * Sets the HTML value.
	 * @param {string} v - The HTML value.
	 */
	setHtml (v: string) {
		this.htmlValue = String(v || '');
	};

	/**
	 * Sets the tab URL value.
	 * @param {string} v - The tab URL value.
	 */
	setTabUrl (v: string) {
		this.tabUrlValue = String(v || '');
	};

};

export const Extension: ExtensionStore = new ExtensionStore();