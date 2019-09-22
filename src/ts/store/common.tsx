import { observable, action, computed } from 'mobx';

class CommonStore {
	@observable public popupList: any[] = [];
	@observable public menuList: any[] = [];
	
	constructor () {
	};
	
	@computed
	get popups(): any[] {
		return this.popupList;
	}
	
	@computed
	get menus(): any[] {
		return this.menuList;
	}
	
	@action
	popupOpen (id: string, param: any) {
		this.popupList.push({ id: id, param: param });
	};
	
	@action
	popupCloseAll () {
		this.popupList = [];
	};
	
	@action
	menuOpen (id: string, param: any) {
		this.menuList.push({ id: id, param: param });
	};
	
	@action
	menuCloseAll () {
		this.menuList = [];
	};
	
};

export let commonStore: CommonStore = new CommonStore();