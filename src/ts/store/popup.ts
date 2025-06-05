import { observable, action, computed, set, makeObservable } from 'mobx';
import $ from 'jquery';
import raf from 'raf';
import { I, S, U, J, focus, Preview } from 'Lib';

const AUTH_IDS = [ 'settings' ];
const NO_DIMMER_IDS = [
	'settingsOnboarding',
	'shortcut',
	'page',
	'export',
	'phrase',
	'objectManager',
	'relation',
	'inviteQr',
];

class PopupStore {

	public popupList: I.Popup[] = [];

	timeout = 0;

	constructor () {
		makeObservable(this, {
			popupList: observable,
			list: computed,
			open: action,
			update: action,
			updateData: action,
			close: action,
			closeAll: action,
		});
	};

	get list(): I.Popup[] {
		return this.popupList;
	};

	/**
	 * Opens a popup with the given ID and parameters.
	 * @param {string} id - The popup ID.
	 * @param {I.PopupParam} param - The popup parameters.
	 */
	open (id: string, param: I.PopupParam) {
		if (AUTH_IDS.includes(id) && !S.Auth.account) {
			return;
		};

		param.data = param.data || {};

		// Auto-confirm in extension
		if (window.isExtension && (id == 'confirm')) {
			if (param.data.onConfirm) {
				param.data.onConfirm();
			};
			return;
		};

		if (!param.preventMenuClose) {
			S.Menu.closeAll();
		};
		focus.clear(true);

		const item = this.get(id);
		if (item) {
			this.update(id, param);
		} else {
			this.popupList.push({ id, param });
		};

		Preview.previewHide(true);
	};

	/**
	 * Gets a popup by ID.
	 * @param {string} id - The popup ID.
	 * @returns {I.Popup} The popup object.
	 */
	get (id: string): I.Popup {
		return this.popupList.find(it => it.id == id);
	};

	/**
	 * Updates a popup with the given ID and parameters.
	 * @param {string} id - The popup ID.
	 * @param {any} param - The popup parameters.
	 */
	update (id: string, param: any) {
		const item = this.get(id);
		if (!item) {
			return;
		};

		param.data = Object.assign(item.param.data, param.data);
		set(item, { param: Object.assign(item.param, param) });
	};

	/**
	 * Updates the data of a popup with the given ID.
	 * @param {string} id - The popup ID.
	 * @param {any} data - The new data.
	 */
	updateData (id: string, data: any) {
		const item = this.get(id);
		if (item) {
			item.param.data = Object.assign(item.param.data, data);
			this.update(id, item.param);
		};
	};

	/**
	 * Checks if a popup is open.
	 * @param {string} [id] - The popup ID.
	 * @param {string[]} [filter] - Filter for popup IDs.
	 * @returns {boolean} True if open, false otherwise.
	 */
	isOpen (id?: string, filter?: string[]): boolean {
		if (!id) {
			let length = 0;
			if (filter) {
				length = this.popupList.filter(it => filter ? !filter.includes(it.id) : true).length;
			} else {
				length = this.popupList.length;
			};
			return length > 0;
		};
		return this.get(id) ? true : false;
	};

	/**
	 * Checks if any popup in a list of IDs is open.
	 * @private
	 * @param {string[]} ids - The popup IDs.
	 * @returns {boolean} True if any popup is open, false otherwise.
	 */
	isOpenList (ids: string[]) {
		for (const id of ids) {
			if (this.isOpen(id)) {
				return true;
			};
		};
		return false;
	};

	/**
	 * Checks if a keyboard-related popup is open.
	 * @private
	 * @returns {boolean} True if a keyboard popup is open, false otherwise.
	 */
	isOpenKeyboard () {
		return this.isOpenList([ 'search', 'template' ]);
	};

	/**
	 * Closes a popup by ID.
	 * @param {string} id - The popup ID.
	 * @param {() => void} [callBack] - Optional callback after close.
	 * @param {boolean} [force] - Whether to force close.
	 */
	close (id: string, callBack?: () => void, force?: boolean) {
		const item = this.get(id);
		if (!item) {
			if (callBack) {
				callBack();
			};
			return;
		};
		
		if (item.param.onClose) {
			item.param.onClose();
		};
		
		const filtered = this.popupList.filter(it => it.id != id);

		if (force) {
			this.popupList = filtered;
		
			if (callBack) {
				callBack();
			};
		} else {
			const el = $(`#${U.Common.toCamelCase(`popup-${id}`)}`);

			if (el.length) {
				raf(() => { el.removeClass('show'); });
			};

			window.setTimeout(() => {
				this.popupList = filtered;

				if (callBack) {
					callBack();
				};

				$(window).trigger('resize');
			}, J.Constant.delay.popup);
		};
	};

	/**
	 * Closes all popups, optionally filtered by IDs.
	 * @param {string[]} [ids] - Popup IDs to close.
	 * @param {() => void} [callBack] - Optional callback after close.
	 */
	closeAll (ids?: string[], callBack?: () => void) {
		const items = this.getItems(ids);
		const timeout = items.length ? J.Constant.delay.popup : 0;

		items.forEach(it => this.close(it.id, null, true));

		this.clearTimeout();
		if (callBack) {
			this.timeout = window.setTimeout(() => callBack(), timeout);
		};
	};

	/**
	 * Gets the popup items, optionally filtered by IDs.
	 * @private
	 * @param {string[]} [ids] - Popup IDs.
	 * @returns {I.Popup[]} The popup items.
	 */
	getItems (ids?: string[]) {
		return ids && ids.length ? this.popupList.filter(it => ids.includes(it.id)) : this.popupList;
	};

	/**
	 * Gets the timeout value for popups.
	 * @private
	 * @returns {number} The timeout value.
	 */
	getTimeout () {
		return this.getItems().length ? J.Constant.delay.popup : 0;
	};

	/**
	 * Gets the last popup in the list.
	 * @private
	 * @returns {I.Popup|null} The last popup or null.
	 */
	getLast () {
		const l = this.popupList.length;
		return l ? this.popupList[l - 1] : null;
	};

	/**
	 * Closes the last open popup.
	 * @private
	 */
	closeLast () {
		const last = this.getLast();
		if (last) {
			this.close(last.id);
		};
	};

	/**
	 * Clears the popup close timeout.
	 * @private
	 */
	clearTimeout () {
		window.clearTimeout(this.timeout);
	};

	/**
	 * Gets the list of popup IDs that do not require a dimmer.
	 * @private
	 * @returns {string[]} The list of popup IDs.
	 */
	noDimmerIds () {
		return NO_DIMMER_IDS;
	};

	/**
	 * Replaces one popup with another.
	 * @private
	 * @param {string} oldId - The old popup ID.
	 * @param {string} newId - The new popup ID.
	 * @param {I.PopupParam} param - The popup parameters.
	 */
	replace (oldId: string, newId: string, param: I.PopupParam) {
		this.close(oldId, () => this.open(newId, param));
	};

};

export const Popup: PopupStore = new PopupStore();
