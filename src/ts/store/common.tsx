import { observable, action, computed } from 'mobx';

export interface PopupParam {
};

export interface PopupInterface {
	id: string;
	param: PopupParam;
};

export interface MenuParam {
	element: string;
	type: string;
	vertical?: string;
	horizontal?: string;
	offsetX: number;
	offsetY: number;
};

export interface MenuInterface {
	id: string;
	param: MenuParam;
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