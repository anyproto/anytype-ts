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
	
};

export let authStore: AuthStore = new AuthStore();