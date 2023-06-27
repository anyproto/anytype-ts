import { observable, action, computed, set, makeObservable } from 'mobx';
import $ from 'jquery';
import raf from 'raf';
import { I, UtilCommon, focus, Preview } from 'Lib';
import { menuStore, authStore } from 'Store';
import Constant from 'json/constant.json';

const AUTH_IDS = [ 'settings' ];
const SHOW_DIMMER = [
	'settings',
	'confirm',
	'migration',
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
            closeAll: action
        });
    };

    get list(): I.Popup[] {
		return this.popupList;
	};

    open (id: string, param: I.PopupParam) {
		if (AUTH_IDS.includes(id)) {
			const { account } = authStore;

			if (!account) {
				return;
			};
		};

		param.data = param.data || {};

		if (!param.preventMenuClose) {
			menuStore.closeAll();
		};
		focus.clear(true);

		const item = this.get(id);
		if (item) {
			this.update(id, param);
		} else {
			this.popupList.push({ id, param });
		};

		Preview.previewHide(true);

		if (this.checkShowDimmer(this.popupList)) {
			$('#navigationPanel').hide();
		};
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

    isOpen (id?: string): boolean {
		if (!id) {
			return this.popupList.length > 0;
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

    close (id: string, callBack?: () => void) {
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
		
		const el = $(`#${UtilCommon.toCamelCase(`popup-${id}`)}`);
		const filtered = this.popupList.filter(it => it.id != id);

		if (el.length) {
			raf(() => { el.css({ transform: '' }).removeClass('show'); });
		};

		if (!this.checkShowDimmer(filtered)) {
			$('#navigationPanel').show();
		};
		
		window.setTimeout(() => {
			this.popupList = filtered;
			
			if (callBack) {
				callBack();
			};

			$(window).trigger('resize');
		}, Constant.delay.popup);
	};

    closeAll (ids?: string[], callBack?: () => void) {
		const items = this.getItems(ids);
		const timeout = this.getTimeout(items);

		items.forEach(it => this.close(it.id));

		this.clearTimeout();
		if (callBack) {
			this.timeout = window.setTimeout(() => callBack(), timeout);
		};
	};

	getItems (ids?: string[]) {
		return ids && ids.length ? this.popupList.filter(it => ids.includes(it.id)) : this.popupList;
	};

	getTimeout (items: I.Popup[]) {
		return items.length ? Constant.delay.popup : 0;
	};

	closeLast () {
		if (this.popupList.length) {
			this.close(this.popupList[this.popupList.length - 1].id);
		};
	};

    clearTimeout () {
		window.clearTimeout(this.timeout);
	};

	showDimmerIds () {
		return SHOW_DIMMER;
	};

	checkShowDimmer (list: I.Popup[]) {
		let ret = false;
		for (const item of list) {
			if (SHOW_DIMMER.includes(item.id)) {
				ret = true;
				break;
			};
		};
		return ret;
	};

};

 export const popupStore: PopupStore = new PopupStore();