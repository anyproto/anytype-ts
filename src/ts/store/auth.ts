import { observable, action, computed, set, makeObservable } from 'mobx';
import { I, M, C, Storage, analytics, Renderer } from 'Lib';
import { blockStore, detailStore, commonStore, dbStore, menuStore } from 'Store';
import { keyboard } from 'Lib';

class AuthStore {
	
	public walletPathValue = '';
	public accountPathValue = '';
	public accountItem: I.Account = null;
	public accountList: I.Account[] = [];
	public icon = '';
	public preview = '';
	public name = '';
	public phrase = '';
	public code = '';
	public token = '';
	public threadMap: Map<string, any> = new Map();

	constructor () {
		makeObservable(this, {
			walletPathValue: observable,
			accountPathValue: observable,
			accountItem: observable,
			accountList: observable,
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

	tokenSet (v: string) {
		this.token = v;
    };

	accountAdd (account: any) {
		account.info = account.info || {};
		account.status = account.status || {};
		account.config = account.config || {};

		this.accountList.push(new M.Account(account));
    };

	accountListClear () {
		this.accountList = [];
    };

	accountSet (account: any) {
		if (!this.accountItem) {
			account.info = account.info || {};
			account.status = account.status || {};
			account.config = account.config || {};

			this.accountItem = new M.Account(account);
		} else {
			set(this.accountItem, account);
		};

		if (account.id) {
			Storage.set('accountId', account.id);
			Renderer.send('setAccount', this.accountItem);
		};
    };

	accountIsDeleted (): boolean {
		return this.accountItem && this.accountItem.status && [ 
			I.AccountStatusType.StartedDeletion,
			I.AccountStatusType.Deleted,
		].includes(this.accountItem.status.type);
	};

	accountIsPending (): boolean {
		return this.accountItem && this.accountItem.status && [ 
			I.AccountStatusType.PendingDeletion,
		].includes(this.accountItem.status.type);
	};

	threadSet (rootId: string, obj: any) {
		const thread = this.threadMap.get(rootId);
		if (thread) {
			set(thread, obj);
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
		this.accountItem = null;

		this.accountListClear();
		this.iconSet('');
		this.previewSet('');
		this.nameSet('');
		this.phraseSet('');
		this.codeSet('');
	};

	logout (removeData: boolean) {
		C.WalletCloseSession(this.token, () => {
			this.tokenSet('');
			C.AccountStop(removeData);
		});

		analytics.event('LogOut');
		analytics.profile('');

		keyboard.setPinChecked(false);

		commonStore.coverSetDefault();
		commonStore.workspaceSet('');

		blockStore.clearAll();
		detailStore.clearAll();
		dbStore.clearAll();
		menuStore.closeAllForced();

		this.clearAll();
		Storage.logout();
    };

};

 export const authStore: AuthStore = new AuthStore();