import { observable, action, computed } from 'mobx';
import { I } from 'ts/lib';

class AuthStore {
	@observable public pin: string = '';
	@observable public accountItem: I.AccountInterface = null;
	@observable public accountList: I.AccountInterface[] = [];
	@observable public icon: string = '';
	@observable public name: string = '';
	@observable public phrase: string = '';
	@observable public index: number = 0;
	
	@computed
	get accounts(): I.AccountInterface[] {
		return this.accountList;
	};
	
	@computed
	get account(): I.AccountInterface {
		return this.accountItem;
	};
	
	@action
	pinSet (v: string) {
		this.pin = v;
	};
	
	@action
	phraseSet (v: string) {
		this.phrase = v;
	};
	
	@action
	indexSet (v: number) {
		this.index = v;
	};
	
	@action
	accountAdd (account: I.AccountInterface) {
		this.accountList.push(account);
	};
	
	@action
	accountSet (account: I.AccountInterface) {
		this.accountItem = account as I.AccountInterface;
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