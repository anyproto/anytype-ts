import { observable, action, computed, set, makeObservable } from 'mobx';
import { I, M, C, S, Storage, analytics, Renderer, keyboard } from 'Lib';

interface NetworkConfig {
	mode: I.NetworkMode;
	path: string;
};

class AuthStore {
	
	public accountItem: I.Account = null;
	public accountList: I.Account[] = [];
	public token = '';
	public appToken = '';
	public appKey = '';
	public threadMap: Map<string, any> = new Map();
	public membershipData: I.Membership = { tier: I.TierType.None, status: I.MembershipStatus.Unknown };
	public syncStatusData: I.SyncStatus = { error: 0, network: 0, status: 3, syncingCounter: 0 };
	
	constructor () {
		makeObservable(this, {
			accountItem: observable,
			accountList: observable,
			threadMap: observable,
			membershipData: observable,
			syncStatusData: observable,
			membership: computed,
			accounts: computed,
			account: computed,
			accountAdd: action,
			accountSet: action,
			threadSet: action,
			membershipSet: action,
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

	get membership (): I.Membership {
		return this.membershipData || { tier: I.TierType.None, status: I.MembershipStatus.Unknown };
	};

	get syncStatus (): I.SyncStatus {
		return this.syncStatusData || { error: 0, network: 0, status: 3, syncingCounter: 0 };
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

	membershipSet (v: I.Membership) {
		this.membershipData = new M.Membership(v);
	};

	membershipUpdate (v: I.Membership) {
		set(this.membershipData, v);
	};

	syncStatusUpdate (v: I.SyncStatus) {
		set(this.syncStatusData, v);
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
		this.membershipSet({ tier: I.TierType.None, status: I.MembershipStatus.Unknown });
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

		S.Common.spaceSet('');
		S.Common.typeSet('');

		S.Block.clearAll();
		S.Detail.clearAll();
		S.Record.clearAll();
		S.Menu.closeAllForced();
		S.Notification.clear();

		this.clearAll();
		Storage.logout();
    };

};

 export const Auth: AuthStore = new AuthStore();