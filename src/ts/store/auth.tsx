import { observable, action, computed, set, makeObservable } from 'mobx';
import { I, Storage, analytics } from 'ts/lib';
import { blockStore, detailStore, commonStore, dbStore } from 'ts/store';
import * as Sentry from '@sentry/browser';
import { keyboard } from 'ts/lib';

class AuthStore {
	
	public walletPathValue: string = '';
	public accountPathValue: string = '';

	public accountItem: I.Account = { 
		id: '', 
		status: { 
			type: I.AccountStatusType.Active, 
			date: 0,
		},
	};
	public accountList: I.Account[] = [];
	public pin: string = '';
	public icon: string = '';
	public preview: string = '';
	public name: string = '';
	public phrase: string = '';
	public code: string = '';
	public threadMap: Map<string, any> = new Map();

	constructor () {
		makeObservable(this, {
			walletPathValue: observable,
			accountPathValue: observable,
			accountItem: observable,
			accountList: observable,
			pin: observable,
			icon: observable,
			preview: observable,
			name: observable,
			phrase: observable,
			code: observable,
			threadMap: observable,
			walletPath: computed,
			accountPath: computed,
			accounts: computed,
			account: computed,
			walletPathSet: action,
			accountPathSet: action,
			pinSet: action,
			phraseSet: action,
			codeSet: action,
			iconSet: action,
			previewSet: action,
			nameSet: action,
			accountAdd: action,
			accountSet: action,
			threadSet: action,
			threadRemove: action,
			clearAll: action,
			logout: action,
		});
	};

	get accounts (): I.Account[] {
		return this.accountList;
	};

    get account (): I.Account {
		return this.accountItem;
    };

	get walletPath (): string {
		return String(this.walletPathValue || '');
    };

	get accountPath (): string {
		return String(this.accountPathValue || '');
    };

	walletPathSet (v: string) {
		this.walletPathValue = v;
    };

	accountPathSet (v: string) {
		this.accountPathValue = v;
    };

	pinSet (v: string) {
		this.pin = v;
    };

	phraseSet (v: string) {
		this.phrase = v;
    };

	codeSet (v: string) {
		this.code = v;
    };

	iconSet (v: string) {
		this.icon = v;
    };

	previewSet (v: string) {
		this.preview = v;
    };

	nameSet (v: string) {
		this.name = v;
    };

	accountAdd (account: I.Account) {
		this.accountList.push(account);
    };

	accountClear () {
		this.accountList = [];
    };

	accountSet (account: any) {
		set(this.accountItem, account);

		if (account.id) {
			Storage.set('accountId', account.id);
			Sentry.setUser({ id: account.id });
		};
    };

	threadSet (rootId: string, obj: any) {
		const thread = this.threadMap.get(rootId);
		if (thread) {
			set(thread, observable(obj));
		} else {
			this.threadMap.set(rootId, observable(obj));
		};
    };

	threadRemove (rootId: string) {
		this.threadMap.delete(rootId);
    };

	threadGet (rootId: string) {
		return this.threadMap.get(rootId) || {};
    };

	clearAll () {
		this.threadMap = new Map();
		this.accountItem = { 
			id: '', 
			status: { 
				type: I.AccountStatusType.Active, 
				date: 0,
			},
		};

		this.accountClear();
		this.iconSet('');
		this.previewSet('');
		this.nameSet('');
		this.phraseSet('');
		this.codeSet('');
	};

	logout () {
		analytics.event('LogOut');
		analytics.profile({ id: '' });

		keyboard.setPinChecked(false);
		commonStore.coverSetDefault();

		blockStore.clearAll();
		detailStore.clearAll();
		dbStore.clearAll();

		Storage.logout();
		this.clearAll();
    };

};

export let authStore: AuthStore = new AuthStore();