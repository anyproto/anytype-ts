import { observable, action, computed } from 'mobx';

export interface AccountInterface {
	id: string;
	name: string;
	color?: string;
	icon?: string;
};

class AuthStore {
	@observable public pin: string = '';
<<<<<<< HEAD
	@observable public account: AccountInterface = null;
=======
>>>>>>> b88246a9dee7d9528caff15946c67e5cb8f72001
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
<<<<<<< HEAD
	accountSet (account: AccountInterface) {
		this.account = account as AccountInterface;
	};
	
	@action
=======
>>>>>>> b88246a9dee7d9528caff15946c67e5cb8f72001
	iconSet (v: string) {
		this.icon = v;
	};
	
	@action
	nameSet (v: string) {
		this.name = v;
	};
	
};

export let authStore: AuthStore = new AuthStore();