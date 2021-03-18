import { observable, action, computed, set } from 'mobx';
import { I, Util, analytics } from 'ts/lib';
import { menuStore } from 'ts/store';

const Constant = require('json/constant.json');
const $ = require('jquery');

class PopupStore {
	@observable public popupList: I.Popup[] = [];
	
	@computed
	get list(): I.Popup[] {
		return this.popupList;
	};
	
	@action
	open (id: string, param: I.PopupParam) {
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
	closeAll () {
		menuStore.closeAll();

		for (let item of this.popupList) {
			this.close(item.id);
		};
	};
	
};

export let popupStore: PopupStore = new PopupStore();