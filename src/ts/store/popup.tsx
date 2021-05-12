import { observable, action, computed, set } from 'mobx';
import { I, Util, analytics } from 'ts/lib';
import { menuStore } from 'ts/store';

const Constant = require('json/constant.json');
const $ = require('jquery');

class PopupStore {
	@observable public popupList: I.Popup[] = [];

	timeout: number = 0;
	
	@computed
	get list(): I.Popup[] {
		return this.popupList;
	};
	
	@action
	open (id: string, param: I.PopupParam) {
		param.data = param.data || {};

		this.close(id, () => {
			this.popupList.push({ id: id, param: param });
		});
		
		analytics.event(Util.toCamelCase('Popup-' + id));
		menuStore.closeAll();
	};

	get (id: string): I.Popup {
		return this.popupList.find((item: I.Menu) => { return item.id == id; });
	};
	
	@action
	update (id: string, param: any) {
		const item = this.get(id);
		if (!item) {
			return;
		};
		
		set(item, { param: param });
	};

	@action
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
		for (let id of ids) {
			if (this.isOpen(id)) {
				return true;
			};
		};
		return false;
	};
	
	@action
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
		
		const el = $('#' + Util.toCamelCase('popup-' + id));
		
		if (el.length) {
			el.css({ transform: '' }).removeClass('show');
		};
		
		window.setTimeout(() => {
			this.popupList = this.popupList.filter((item: I.Popup) => { return item.id != id; });
			
			if (callBack) {
				callBack();
			};
		}, Constant.delay.popup);
	};
	
	@action
	closeAll (ids?: string[], callBack?: () => void) {
		const items = ids && ids.length ? this.popupList.filter((it: I.Menu) => { return ids.indexOf(it.id) >= 0; }) : this.popupList;

		for (let item of items) {
			this.close(item.id);
		};

		this.clearTimeout();

		if (callBack) {
			this.timeout = window.setTimeout(() => { callBack(); }, Constant.delay.popup);
		};
	};

	clearTimeout () {
		window.clearTimeout(this.timeout);
	};
	
};

export let popupStore: PopupStore = new PopupStore();