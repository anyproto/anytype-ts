import { observable, action, computed, set } from 'mobx';
import { I, Storage, analytics, crumbs } from 'ts/lib';
import { blockStore, detailStore, commonStore, dbStore } from 'ts/store';
import * as Sentry from '@sentry/browser';
import { keyboard } from 'ts/lib';

class AuthStore {
	@observable public dataPath: string = '';
	@observable public accountItem: I.Account = null;
	@observable public accountList: I.Account[] = [];
	@observable public pin: string = '';
	@observable public icon: string = '';
	@observable public preview: string = '';
	@observable public name: string = '';
	@observable public phrase: string = '';
	@observable public code: string = '';
	@observable public threadMap: Map<string, any> = new Map();
	
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
	previewSet (v: string) {
		this.preview = v;
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

		Storage.set('accountId', account.id);
		analytics.profile(account);
		Sentry.setUser({ id: account.id });
	};

	@action
	threadSet (rootId: string, obj: any) {
		const thread = this.threadMap.get(rootId);
		if (thread) {
			set(thread, observable(obj));
		} else {
			this.threadMap.set(rootId, observable(obj));
		};
	};

	@action
	threadRemove (rootId: string) {
		this.threadMap.delete(rootId);
	};

	threadGet (rootId) {
		return this.threadMap.get(rootId) || {};
	};

	@action
	logout () {
		Storage.logout();

		keyboard.setPinChecked(false);
		crumbs.delete(I.CrumbsType.Page);
		crumbs.delete(I.CrumbsType.Recent);

		commonStore.coverSetDefault();

		blockStore.breadcrumbsSet('');
		blockStore.recentSet('');
		blockStore.clearAll();
		detailStore.clearAll();

		dbStore.objectTypesClear();

		this.accountItem = null;
		this.nameSet('');
		this.previewSet('');
		this.phraseSet('');
	};
	
};

export let authStore: AuthStore = new AuthStore();