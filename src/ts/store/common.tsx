import { observable, action, computed, set } from 'mobx';
import { I, Storage, Util } from 'ts/lib';

const $ = require('jquery');
const COVER = 3;
const TIMEOUT = 200;

class CommonStore {
	@observable public popupList: I.Popup[] = [];
	@observable public menuList: I.Menu[] = [];
	@observable public coverNum: number = 0;
	@observable public coverImage: string = '';
	@observable public progressObj: I.Progress = { status: '', current: 0, total: 0 };
	@observable public filterString: string = '';
	@observable public gatewayUrl: string = '';
	
	@computed
	get progress(): I.Progress {
		return this.progressObj;
	};
	
	@computed
	get filter(): string {
		return String(this.filterString || '');
	};
	
	@computed
	get coverId(): number {
		return Number(this.coverNum || Storage.get('coverNum')) || COVER;
	};
	
	@computed
	get coverImg(): string {
		return String(this.coverImage || Storage.get('coverImage') || '');
	};
	
	@computed
	get popups(): I.Popup[] {
		return this.popupList;
	};
	
	@computed
	get menus(): I.Menu[] {
		return this.menuList;
	};
	
	@computed
	get gateway(): string {
		return this.gatewayUrl;
	};
	
	@action
	coverSetNum (num: number) {
		this.coverNum = num;
		Storage.set('coverNum', this.coverNum);
	};
	
	@action
	coverSetImage (image: string) {
		this.coverImage = image;
		Storage.set('coverImage', this.coverImage);
	};
	
	@action
	gatewaySet (v: string) {
		this.gatewayUrl = v;
	};
	
	fileUrl (hash: string) {
		return this.gatewayUrl + '/file/' + hash;
	};
	
	imageUrl (hash: string, width: number) {
		return this.gatewayUrl + '/image/' + hash + '?width=' + width;
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
		this.popupClose(id, () => {
			this.popupList.push({ id: id, param: param });
		});
	};
	
	@action
	popupUpdate (id: string, param: any) {
		let item = this.popupList.find((item: I.Popup) => { return item.id == id; });
		if (!item) {
			return;
		};
		
		set(item, { param: param });
	};
	
	popupIsOpen (id?: string): boolean {
		if (!id) {
			return this.popupList.length > 0;
		};
		return this.popupList.find((item: I.Popup) => { return item.id == id; }) ? true : false;
	};
	
	@action
	popupClose (id: string, callBack?: () => void) {
		const item: I.Popup = this.popupList.find((item: I.Popup) => { return item.id == id; });
		
		if (!item) {
			if (callBack) {
				callBack();
			};
			return;
		};
		
		if (item.param.onClose) {
			item.param.onClose();
		};
		
		const el = $('#' + $.escapeSelector(Util.toCamelCase('popup-' + id)));
		const dimmer = $('#dimmer');
		
		if (el.length) {
			el.css({ transform: '' }).removeClass('show');
		};
		
		if (dimmer.length && (this.popupList.length == 1)) {
			dimmer.removeClass('show');
		};
		
		window.setTimeout(() => {
			this.popupList = this.popupList.filter((item: I.Popup) => { return item.id != id; });
			
			if (callBack) {
				callBack();
			};
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
	
	menuIsOpen (id?: string): boolean {
		if (!id) {
			return this.menuList.length > 0;
		};
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
		
		const el = $('#' + $.escapeSelector(Util.toCamelCase('menu-' + id)));
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
	
	@action
	filterSet (v: string) {
		v = v.replace(/^\//, '');
		this.filterString = String(v || '');
	};
	
};

export let commonStore: CommonStore = new CommonStore();