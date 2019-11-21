import { observable, action, computed } from 'mobx';
import { I, Storage, Util } from 'ts/lib';

const $ = require('jquery');
const COVER = 3;
const TIMEOUT = 200;

class CommonStore {
	@observable public popupList: I.Popup[] = [];
	@observable public menuList: I.Menu[] = [];
	@observable public coverId: number = 0;
	@observable public progressObj: I.Progress = { status: '', current: 0, total: 0 };
	
	@computed
	get progress(): I.Progress {
		return this.progressObj;
	};
	
	@computed
	get cover(): number {
		return this.coverId || Storage.get('cover') || COVER;
	};
	
	@computed
	get popups(): I.Popup[] {
		return this.popupList;
	};
	
	@computed
	get menus(): I.Menu[] {
		return this.menuList;
	};
	
	@action
	coverSet (v: number) {
		this.coverId = v;
		Storage.set('cover', v);
	};
	
	@action
	progressSet (v: I.Progress) {
		this.progressObj = v;
	};
	
	@action
	progressClear () {
		this.progressObj = { status: '', current: 0, total: 0 };
	};
	
	@action
	popupOpen (id: string, param: I.PopupParam) {
		this.popupClose(id);
		this.popupList.push({ id: id, param: param });
	};
	
	popupIsOpen (id: string): boolean {
		return this.popupList.find((item: I.Popup) => { return item.id == id; }) ? true : false;
	};
	
	@action
	popupClose (id: string) {
		const item: I.Popup = this.popupList.find((item: I.Popup) => { return item.id == id; });
		
		if (!item) {
			return;
		};
		
		if (item.param.onClose) {
			item.param.onClose();
		};
		
		const el = $('#' + Util.toCamelCase('popup-' + id));
		const dimmer = $('#dimmer');
		
		if (el.length) {
			el.css({ transform: '' }).removeClass('show');
		};
		
		if (dimmer.length && (this.popupList.length == 1)) {
			dimmer.removeClass('show');
		};
		
		window.setTimeout(() => {
			this.popupList = this.popupList.filter((item: I.Popup) => { return item.id != id; });
		}, TIMEOUT);
	};
	
	@action
	popupCloseAll () {
		for (let item of this.popupList) {
			this.popupClose(item.id);
		};
	};
	
	@action
	menuOpen (id: string, param: I.MenuParam) {
		param.element = String(param.element || '');
		param.offsetX = Number(param.offsetX) || 0;
		param.offsetY = Number(param.offsetY) || 0;
		
		if (!param.element) {
			throw 'Element is not defined';
		};
		
		this.menuClose(id, () => {
			this.menuList.push({ id: id, param: param });			
		});
	};
	
	menuIsOpen (id: string): boolean {
		return this.menuList.find((item: I.Menu) => { return item.id == id; }) ? true : false;
	};
	
	@action
	menuClose (id: string, callBack?: () => void) {
		const item: I.Menu = this.menuList.find((item: I.Menu) => { return item.id == id; });
		
		if (!item) {
			if (callBack) {
				callBack();
			};
			return;
		};
		
		if (item.param.onClose) {
			item.param.onClose();
		};
		
		const el = $('#' + Util.toCamelCase('menu-' + id));
		if (el.length) {
			el.css({ transform: '' }).removeClass('show');
		};
		
		window.setTimeout(() => {
			this.menuList = this.menuList.filter((item: I.Menu) => { return item.id != id; });
			
			if (callBack) {
				callBack();
			};
		}, TIMEOUT);
	};
	
	@action
	menuCloseAll () {
		for (let item of this.menuList) {
			this.menuClose(item.id);
		};
	};
	
};

export let commonStore: CommonStore = new CommonStore();