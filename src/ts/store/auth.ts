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

	/**
	 * Sets the authentication token.
	 * @param {string} v - The token value.
	 */
	tokenSet (v: string) {
		this.token = String(v || '');
		Renderer.send('setToken', this.token);
	};

	/**
	 * Sets the app token.
	 * @param {string} v - The app token value.
	 */
	appTokenSet (v: string) {
		this.appToken = String(v || '');
	};

	/**
	 * Sets the network configuration.
	 * @param {NetworkConfig} obj - The network configuration object.
	 */
	networkConfigSet (obj: NetworkConfig) {
		Storage.set('networkConfig', obj);
	};

	/**
	 * Sets the app key.
	 * @param {string} v - The app key value.
	 */
	appKeySet (v: string) {
		this.appKey = String(v || '');
	};

	/**
	 * Sets the membership data.
	 * @param {I.Membership} v - The membership data.
	 */
	membershipSet (v: I.Membership) {
		this.membershipData = v;
	};

	/**
	 * Updates the membership data.
	 * @param {I.Membership} v - The membership data.
	 */
	membershipUpdate (v: I.Membership) {
		set(this.membershipData, v);
	};

	/**
	 * Updates the sync status for a space.
	 * @param {I.SyncStatus} v - The sync status object.
	 */
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

	/**
	 * Adds an account to the account list.
	 * @param {any} account - The account object.
	 */
	accountAdd (account: any) {
		account.info = account.info || {};
		account.status = account.status || {};
		account.config = account.config || {};

		this.accountList.push(new M.Account(account));
	};

	/**
	 * Clears the account list.
	 * @private
	 */
	accountListClear () {
		this.accountList = [];
	};

	/**
	 * Sets the current account.
	 * @param {any} account - The account object.
	 */
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
		};
	};

	/**
	 * Sets the status of the current account.
	 * @param {I.AccountStatus} status - The account status.
	 */
	accountSetStatus (status: I.AccountStatus) {
		if (this.accountItem) {
			set(this.accountItem.status, status);
		};
	};

	/**
	 * Checks if the current account is deleted.
	 * @returns {boolean} True if deleted, false otherwise.
	 */
	accountIsDeleted (): boolean {
		return this.accountItem && this.accountItem.status && [ 
			I.AccountStatusType.StartedDeletion,
			I.AccountStatusType.Deleted,
		].includes(this.accountItem.status.type);
	};

	/**
	 * Checks if the current account is pending deletion.
	 * @returns {boolean} True if pending, false otherwise.
	 */
	accountIsPending (): boolean {
		return this.accountItem && this.accountItem.status && [ 
			I.AccountStatusType.PendingDeletion,
		].includes(this.accountItem.status.type);
	};

	/**
	 * Gets the default sync status object.
	 * @private
	 * @returns {I.SyncStatus} The default sync status.
	 */
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

	/**
	 * Gets the sync status for a space.
	 * @param {string} [spaceId] - The space ID.
	 * @returns {I.SyncStatus} The sync status.
	 */
	getSyncStatus (spaceId?: string): I.SyncStatus {
		return this.syncStatusMap.get(spaceId || S.Common.space) || this.getDefaultSyncStatus();
	};

	/**
	 * Clears all authentication and account data.
	 */
	clearAll () {
		this.accountItem = null;

		this.accountListClear();
		this.membershipSet({ tier: I.TierType.None, status: I.MembershipStatus.Unknown });
		this.syncStatusMap.clear();
	};

	/**
	 * Logs out the current account.
	 * @param {boolean} mainWindow - Whether this is the main window.
	 * @param {boolean} removeData - Whether to remove data.
	 */
	logout (mainWindow: boolean, removeData: boolean) {
		U.Subscription.destroyAll(() => {
			if (mainWindow) {
				if (S.Auth.token) {
					C.AccountStop(removeData, () => U.Data.closeSession());
				};
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

		});
	};

};

export const Auth: AuthStore = new AuthStore();
