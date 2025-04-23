import { observable, action, computed, set, makeObservable, intercept } from 'mobx';
import { I, M, C, S, U, Storage, analytics, Renderer, keyboard } from 'Lib';

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
	public startingId = '';
	public membershipData: I.Membership = { tier: I.TierType.None, status: I.MembershipStatus.Unknown };
	public syncStatusMap: Map<string, I.SyncStatus> = new Map();
	
	constructor () {
		makeObservable(this, {
			accountItem: observable,
			accountList: observable,
			membershipData: observable,
			membership: computed,
			accounts: computed,
			account: computed,
			accountAdd: action,
			accountSet: action,
			membershipSet: action,
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

	tokenSet (v: string) {
		this.token = String(v || '');
	};

	appTokenSet (v: string) {
		this.appToken = String(v || '');
	};

	networkConfigSet (obj: NetworkConfig) {
		Storage.set('networkConfig', obj);
	};

	appKeySet (v: string) {
		this.appKey = String(v || '');
	};

	membershipSet (v: I.Membership) {
		this.membershipData = v;
	};

	membershipUpdate (v: I.Membership) {
		set(this.membershipData, v);
	};

	syncStatusUpdate (v: I.SyncStatus) {
		let obj = this.syncStatusMap.get(v.id);

		if (!obj) {
			obj = Object.assign(this.getDefaultSyncStatus(), v);

			makeObservable(obj, {
				error: observable,
				network: observable,
				status: observable,
				p2p: observable,
				syncingCounter: observable,
				devicesCounter: observable,
			});

			intercept(obj as any, change => U.Common.intercept(obj, change));
		} else {
			set(obj, v);
		};

		this.syncStatusMap.set(v.id, obj);
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

	getDefaultSyncStatus (): I.SyncStatus {
		return {
			id: '',
			error: I.SyncStatusError.None,
			network: I.SyncStatusNetwork.Anytype,
			status: I.SyncStatusSpace.Offline,
			p2p: I.P2PStatus.NotConnected,
			syncingCounter: 0,
			devicesCounter: 0,
		};
	};

	getSyncStatus (spaceId?: string): I.SyncStatus {
		return this.syncStatusMap.get(spaceId || S.Common.space) || this.getDefaultSyncStatus();
	};

	clearAll () {
		this.accountItem = null;

		this.accountListClear();
		this.membershipSet({ tier: I.TierType.None, status: I.MembershipStatus.Unknown });
		this.syncStatusMap.clear();
	};

	logout (mainWindow: boolean, removeData: boolean) {
		if (mainWindow) {
			C.AccountStop(removeData, () => U.Data.closeSession());
			Renderer.send('logout');
		} else {
			U.Data.closeSession();
		};

		analytics.profile('', '');
		analytics.removeContext();

		keyboard.setPinChecked(false);

		S.Common.spaceSet('');

		S.Block.clearAll();
		S.Detail.clearAll();
		S.Record.clearAll();
		S.Menu.closeAllForced();
		S.Notification.clear();
		S.Chat.clearAll();

		this.clearAll();
		Storage.logout();
	};

};

 export const Auth: AuthStore = new AuthStore();
