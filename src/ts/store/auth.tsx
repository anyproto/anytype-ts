import { observable, action, computed } from 'mobx';

export interface AccountInterface {
	id: string;
	name: string;
	color?: string;
	icon?: string;
};

class AuthStore {
	@observable public pin: string = '';
	@observable public accountList: AccountInterface[] = [];
	@observable public icon: string = '';
	@observable public name: string = '';
	
	@computed
	get accounts(): AccountInterface[] {
		return this.accountList;
	};
	
	@action
	pinSet (v: string) {
		this.pin = v;
	};
	
	@action
	accountAdd (account: AccountInterface) {
		this.accountList.push(account);
	};
	
	@action
	iconSet (v: string) {
		this.icon = v;
	};
	
	@action
	nameSet (v: string) {
		this.name = v;
	};
	
};

export let authStore: AuthStore = new AuthStore();