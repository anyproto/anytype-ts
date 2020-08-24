import { observable, action, computed, set } from 'mobx';
import { I, Storage, analytics, crumbs } from 'ts/lib';
import { blockStore } from 'ts/store';
import { commonStore } from './common';
import * as Sentry from '@sentry/browser';
import { keyboard } from 'ts/lib';

class AuthStore {
	@observable public dataPath: string = '';
	@observable public accountItem: I.Account = null;
	@observable public accountList: I.Account[] = [];
	@observable public pin: string = '';
	@observable public icon: string = '';
	@observable public name: string = '';
	@observable public phrase: string = '';
	@observable public code: string = '';
	
	@computed
	get accounts(): I.Account[] {
		return this.accountList;
	};
	
	@computed
	get account(): I.Account {
		return this.accountItem;
	};
	
	@computed
	get path(): string {
		return this.dataPath || Storage.get('dataPath') || '';
	};
	
	@action
	pathSet (v: string) {
		this.dataPath = v;
		Storage.set('dataPath', v);
	};
	
	@action
	pinSet (v: string) {
		this.pin = v;
	};
	
	@action
	phraseSet (v: string) {
		this.phrase = v;
		Storage.set('phrase', v);
	};
	
	@action
	codeSet (v: string) {
		this.code = v;
	};
	
	@action
	iconSet (v: string) {
		this.icon = v;
	};
	
	@action
	nameSet (v: string) {
		this.name = v;
	};
	
	@action
	accountAdd (account: I.Account) {
		this.accountList.push(account);
	};
	
	accountClear () {
		this.accountList = [];
	};
	
	@action
	accountSet (account: I.Account) {
		this.accountItem = account as I.Account;

		analytics.profile(account);
		Sentry.setUser({ id: account.id });
	};
	
	@action
	logout () {
		Storage.logout();

		keyboard.setPinChecked(false);
		crumbs.delete(I.CrumbsType.Page);

		commonStore.coverSetDefault();

		blockStore.breadcrumbsSet('');
		blockStore.blocksClearAll();

		this.accountItem = null;
		this.phraseSet('');
	};
	
};

export let authStore: AuthStore = new AuthStore();