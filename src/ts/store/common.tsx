import { observable, action, computed } from 'mobx';

class CommonStore {
	@observable public popupList: any[] = [];
	
	constructor () {
	};
	
	@computed
	get popups(): any[] {
		return this.popupList;
	}
	
	@action
	popupOpen (id: string, param: any) {
		this.popupList.push({ id: id, param: param });
	};
	
	@action
	popupCloseAll () {
		this.popupList = [];
	};
	
};

export let commonStore: CommonStore = new CommonStore();