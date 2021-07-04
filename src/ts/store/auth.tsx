import { observable, action, computed, set, makeObservable } from 'mobx';
import { I, Storage, analytics, crumbs } from 'ts/lib';
import { blockStore, detailStore, commonStore, dbStore } from 'ts/store';
import * as Sentry from '@sentry/browser';
import { keyboard } from 'ts/lib';

class AuthStore {

    public dataPath: string = '';
    public accountItem: I.Account = null;
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
            dataPath: observable,
            accountItem: observable,
            accountList: observable,
            pin: observable,
            icon: observable,
            preview: observable,
            name: observable,
            phrase: observable,
            code: observable,
            threadMap: observable,
            accounts: computed,
            account: computed,
            path: computed,
            pathSet: action,
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
            logout: action
        });
    };

    get accounts (): I.Account[] {
		return this.accountList;
	};

    get account (): I.Account {
		return this.accountItem;
	};

    get path (): string {
		return this.dataPath || Storage.get('dataPath') || '';
	};

    pathSet (v: string) {
		this.dataPath = v;
		Storage.set('dataPath', v);
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

    accountSet (account: I.Account) {
		this.accountItem = account as I.Account;

		Storage.set('accountId', account.id);
		analytics.profile(account);
		Sentry.setUser({ id: account.id });
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

    threadGet (rootId) {
		return this.threadMap.get(rootId) || {};
	};

    logout() {
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