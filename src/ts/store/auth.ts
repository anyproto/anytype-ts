import { observable, action, computed, set, makeObservable } from 'mobx';
import { I, M, C, Storage, analytics, Renderer } from 'Lib';
import { blockStore, detailStore, commonStore, dbStore, menuStore, notificationStore } from 'Store';
import { keyboard } from 'Lib';

interface NetworkConfig {
	mode: I.NetworkMode;
	path: string;
};

class AuthStore {
	
	public walletPathValue = '';
	public accountPathValue = '';
	public accountItem: I.Account = null;
	public accountList: I.Account[] = [];
	public name = '';
	public phrase = '';
	public token = '';
	public appToken = '';
	public appKey = '';
	public threadMap: Map<string, any> = new Map();
	
	constructor () {
		makeObservable(this, {
			walletPathValue: observable,
			accountPathValue: observable,
			accountItem: observable,
			accountList: observable,
			name: observable,
			phrase: observable,
			threadMap: observable,
			walletPath: computed,
			accountPath: computed,
			accounts: computed,
			account: computed,
			walletPathSet: action,
			accountPathSet: action,
			phraseSet: action,
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

	get accountSpaceId (): string {
		return String(this.accountItem?.info?.accountSpaceId || '');
	};

	get networkConfig (): NetworkConfig {
		const obj = Storage.get('networkConfig') || {};

		return {
			mode: Number(obj.mode) || I.NetworkMode.Default,
			path: String(obj.path || ''),
		};
	};

	walletPathSet (v: string) {
		this.walletPathValue = String(v || '');
    };

	accountPathSet (v: string) {
		this.accountPathValue = String(v || '');
    };

	phraseSet (v: string) {
		this.phrase = String(v || '');
    };

	nameSet (v: string) {
		this.name = String(v || '');
    };

	tokenSet (v: string) {
		this.token = String(v || '');
	};

	appTokenSet (v: string) {
		this.appToken = String(v || '');
    };

	networkConfigSet (obj: NetworkConfig) {
		Storage.set('networkConfig', obj, true);
	};

	appKeySet (v: string) {
		this.appKey = String(v || '');
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
		account = account || {};
		account.info = account.info || {};
		account.status = account.status || {};
		account.config = account.config || {};

		if (!this.accountItem) {
			this.accountItem = new M.Account(account);
		} else {
			set(this.accountItem, account);
		};

		if (account.id) {
			Storage.set('accountId', account.id);
			Renderer.send('setAccount', this.accountItem);
		};
    };

	accountSetStatus (status: I.AccountStatus) {
		if (this.accountItem) {
			set(this.accountItem.status, status);
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
		this.nameSet('');
		this.phraseSet('');
	};

	logout (mainWindow: boolean, removeData: boolean) {
		if (mainWindow) {
			C.AccountStop(removeData, () => {
				C.WalletCloseSession(this.token);

                this.tokenSet('');
			});

			analytics.event('LogOut');
			Renderer.send('logout');
		};

		analytics.profile('', '');
		analytics.removeContext();

		keyboard.setPinChecked(false);

		commonStore.spaceSet('');
		commonStore.typeSet('');

		blockStore.clearAll();
		detailStore.clearAll();
		dbStore.clearAll();
		menuStore.closeAllForced();
		notificationStore.clear();

		this.clearAll();
		Storage.logout();
    };

};

 export const authStore: AuthStore = new AuthStore();