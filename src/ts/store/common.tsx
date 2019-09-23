import { observable, action, computed } from 'mobx';

export interface PopupParam {
	onClose?(): void;
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
	onClose?(): void;
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
	get popups(): PopupInterface[] {
		return this.popupList;
	};
	
	@computed
	get menus(): MenuInterface[] {
		return this.menuList;
	};
	
	@action
	popupOpen (id: string, param: PopupParam) {
		this.popupClose(id);
		this.popupList.push({ id: id, param: param });
	};
	
	@action
	popupClose (id: string) {
		const item: PopupInterface = this.popupList.find((item: PopupInterface) => { return item.id == id; });
		
		if (item && item.param.onClose) {
			item.param.onClose();
		};
		
		this.popupList = this.popupList.filter((item: PopupInterface) => { return item.id != id; });
	};
	
	@action
	popupCloseAll () {
		for (let item of this.popupList) {
			this.popupClose(item.id);
		};
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
		const item: MenuInterface = this.menuList.find((item: MenuInterface) => { return item.id == id; });
		
		if (item && item.param.onClose) {
			item.param.onClose();
		};
		
		this.menuList = this.menuList.filter((item: MenuInterface) => { return item.id != id; });
	};
	
	@action
	menuCloseAll () {
		for (let item of this.menuList) {
			this.menuClose(item.id);
		};
	};
	
};

export let commonStore: CommonStore = new CommonStore();