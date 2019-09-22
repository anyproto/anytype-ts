import { observable, action, computed } from 'mobx';

export interface PopupParam {
};

export interface PopupInterface {
	id: string;
	param: PopupParam;
};

export enum MenuType { Vertical = 1, Horizontal };
export enum MenuDirection { Top = 1, Bottom, Left, Right };

export interface MenuParam {
	element: string;
	type: MenuType;
	vertical: MenuDirection;
	horizontal: MenuDirection;
	offsetX: number;
	offsetY: number;
};

export interface MenuInterface {
	id: string;
	param: MenuParam;
};

export interface MenuItemInterface {
	id: string;
	name: string;
};

class CommonStore {
	@observable public popupList: PopupInterface[] = [];
	@observable public menuList: MenuInterface[] = [];
	
	@computed
	get popups(): any[] {
		return this.popupList;
	}
	
	@computed
	get menus(): any[] {
		return this.menuList;
	}
	
	@action
	popupOpen (id: string, param: PopupParam) {
		this.popupClose(id);
		this.popupList.push({ id: id, param: param });
	};
	
	@action
	popupClose (id: string) {
		this.popupList = this.popupList.filter((item: PopupInterface) => { return item.id != id; });
	};
	
	@action
	popupCloseAll () {
		this.popupList = [];
	};
	
	@action
	menuOpen (id: string, param: MenuParam) {
		param.element = String(param.element || '');
		param.offsetX = Number(param.offsetX) || 0;
		param.offsetY = Number(param.offsetY) || 0;
		
		if (!param.element) {
			throw 'Element is not defined';
		};
		
		this.menuClose(id);
		this.menuList.push({ id: id, param: param });
	};
	
	@action
	menuClose (id: string) {
		this.menuList = this.menuList.filter((item: MenuInterface) => { return item.id != id; });
	};
	
	@action
	menuCloseAll () {
		this.menuList = [];
	};
	
};

export let commonStore: CommonStore = new CommonStore();