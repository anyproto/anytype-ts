import { action, computed, makeObservable, observable } from 'mobx';
import type { AiAppId, AiConnection, AiDetection, AiListResult } from '../interface/aiConnect';
import { CATALOG } from '../lib/aiConnect/catalog';
import { connectionAtTarget, connectionForCard, siblingCards, visibleConnections } from '../lib/aiConnect/gallery';

/**
 * Connect to AI apps: what main reported for this account — detections and connections (§4.1).
 * Never holds a key: records carry only a hash and a fingerprint.
 */
class AiConnectStore {

	/** The account this data belongs to ('' = none yet): another account's data is never shown (W20) */
	public accountId = '';
	public detectionMap = observable.map<AiAppId, AiDetection>();
	public connectionList: AiConnection[] = [];
	public scanOk = true;
	public isLoading = false;
	public isLoaded = false;
	public isChecked = false;
	/** The last list or check couldn't read main's list (the earlier data stays shown) */
	public loadFailed = false;
	/** An undelivered key couldn't be deleted yet (the page shows the Local API hint) */
	public cleanupFailed = false;

	constructor () {
		makeObservable(this, {
			accountId: observable,
			connectionList: observable,
			scanOk: observable,
			isLoading: observable,
			isLoaded: observable,
			isChecked: observable,
			loadFailed: observable,
			cleanupFailed: observable,
			setLoadFailed: action,
			setCleanupFailed: action,
			connections: computed,
			set: action,
			setConnections: action,
			upsert: action,
			remove: action,
			setLoading: action,
			setChecked: action,
			markFirstUse: action,
			clear: action,
			ensureAccount: action,
		});
	};

	/** Records that are not removed, plus removed ones still waiting for a revoke (Retry) */
	get connections (): AiConnection[] {
		return visibleConnections(this.connectionList);
	};

	detection (appId: AiAppId): AiDetection | null {
		return this.detectionMap.get(appId) || null;
	};

	isInstalled (appId: AiAppId): boolean {
		return !!this.detection(appId)?.installed;
	};

	icon (appId: AiAppId): string {
		return this.detection(appId)?.icon || '';
	};

	/** The connection a card shows: same target id, and its file is one the card reads */
	getByApp (appId: AiAppId): AiConnection | null {
		return connectionForCard(appId, this.detectionMap, this.connectionList);
	};

	/** By record id: rows, Manage and routes address connections this way (the only way for Other-app ones) */
	getById (id: string): AiConnection | null {
		return this.connectionList.find(it => it.id == id) || null;
	};

	/** The record main compares a delivery with: the one at the card's target id */
	atTarget (appId: AiAppId): AiConnection | null {
		return connectionAtTarget(this.detection(appId)?.targetId, this.connectionList);
	};

	others (): AiConnection[] {
		return this.connections.filter(it => it.appId == 'other');
	};

	/** Other installed cards that use the same record */
	siblings (connection: AiConnection): AiAppId[] {
		return siblingCards(connection, CATALOG, this.detectionMap);
	};

	set (res: AiListResult, accountId?: string) {
		if (!res || !res.ok) {
			return;
		};

		if (accountId !== undefined) {
			this.accountId = accountId;
		};
		this.detectionMap.clear();
		(res.detections || []).forEach(it => this.detectionMap.set(it.appId, it));
		this.connectionList = res.connections || [];
		this.scanOk = res.scanOk;
		this.isLoaded = true;
	};

	setConnections (list: AiConnection[]) {
		this.connectionList = list || [];
	};

	upsert (connection: AiConnection) {
		if (!connection) {
			return;
		};

		const idx = this.connectionList.findIndex(it => it.id == connection.id);

		if (idx >= 0) {
			this.connectionList[idx] = connection;
		} else {
			this.connectionList.push(connection);
		};
	};

	remove (id: string) {
		this.connectionList = this.connectionList.filter(it => it.id != id);
	};

	setLoading (v: boolean) {
		this.isLoading = v;
	};

	setChecked (v: boolean) {
		this.isChecked = v;
	};

	setLoadFailed (v: boolean) {
		this.loadFailed = v;
	};

	setCleanupFailed (v: boolean) {
		this.cleanupFailed = v;
	};

	/** Reserved for heart's first-use event; unused in the POC */
	markFirstUse (appHash: string, at: number) {
		const item = this.connectionList.find(it => it.appHash == appHash);

		if (item) {
			this.upsert({ ...item, firstUsedAt: at });
		};
	};

	/** Data of another account is dropped before this one's is loaded, so a failed load never shows it (W20) */
	ensureAccount (accountId: string) {
		if (this.accountId != accountId) {
			this.clear();
			this.accountId = accountId;
		};
	};

	clear () {
		this.accountId = '';
		this.detectionMap.clear();
		this.connectionList = [];
		this.scanOk = true;
		this.isLoading = false;
		this.isLoaded = false;
		this.isChecked = false;
		this.loadFailed = false;
		this.cleanupFailed = false;
	};

};

export const AiConnect: AiConnectStore = new AiConnectStore();
export { AiConnectStore };
