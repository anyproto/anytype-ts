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

	get (id: string): I.Popup {
		return this.popupList.find(it => it.id == id);
	};

	update (id: string, param: any) {
		const item = this.get(id);
		if (!item) {
			return;
		};

		param.data = Object.assign(item.param.data, param.data);
		set(item, { param: Object.assign(item.param, param) });
	};

	updateData (id: string, data: any) {
		const item = this.get(id);
		if (item) {
			item.param.data = Object.assign(item.param.data, data);
			this.update(id, item.param);
		};
	};

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

	isOpenList (ids: string[]) {
		for (const id of ids) {
			if (this.isOpen(id)) {
				return true;
			};
		};
		return false;
	};

	isOpenKeyboard () {
		return this.isOpenList([ 'search', 'template' ]);
	};

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

	closeAll (ids?: string[], callBack?: () => void) {
		const items = this.getItems(ids);
		const timeout = items.length ? J.Constant.delay.popup : 0;

		items.forEach(it => this.close(it.id, null, true));

		this.clearTimeout();
		if (callBack) {
			this.timeout = window.setTimeout(() => callBack(), timeout);
		};
	};

	getItems (ids?: string[]) {
		return ids && ids.length ? this.popupList.filter(it => ids.includes(it.id)) : this.popupList;
	};

	getTimeout () {
		return this.getItems().length ? J.Constant.delay.popup : 0;
	};

	getLast () {
		const l = this.popupList.length;
		return l ? this.popupList[l - 1] : null;
	};

	closeLast () {
		const last = this.getLast();
		if (last) {
			this.close(last.id);
		};
	};

	clearTimeout () {
		window.clearTimeout(this.timeout);
	};

	noDimmerIds () {
		return NO_DIMMER_IDS;
	};

	replace (oldId: string, newId: string, param: I.PopupParam) {
		this.close(oldId, () => this.open(newId, param));
	};

};

export const Popup: PopupStore = new PopupStore();
