/** Caller identity as it arrived in Event.Account.LinkApprovalRequest. Fields are echoed back to
 * heart verbatim: never trim, lowercase or otherwise normalize them. */
export interface ClientInfo {
	processName?: string;
	processPath?: string;
	name?: string;
	origin?: string;
	signatureVerified?: boolean;
};

export interface ApprovalRequest {
	clientInfo: ClientInfo;
	scope: number;
	theme?: string;
	lang?: string;
};

export interface ApprovalPayload extends ApprovalRequest {
	key: string;
};

/** Everything the manager needs from the outside world, injected so the queue logic stays testable
 * without Electron. */
export interface LinkApprovalHandlers {
	open (payload: ApprovalPayload): void;
	close (key: string): void;
	code (key: string, challenge: string): void;
	liveTargets (): number[];
	sendDecision (targetId: number, payload: any): boolean;
};

interface Entry {
	key: string;
	request: ApprovalRequest;
	sourceId: number;
	decided?: boolean;
};

/** Backstops only: dismissal is driven by Event.Account.LinkApprovalHide. They exist so a lost event
 * cannot strand an always-on-top window, and sit above heart's own 60s / 5min expiry. */
export const PENDING_BACKSTOP_MS = 90 * 1000;
export const CODE_BACKSTOP_MS = 6 * 60 * 1000;

export const approvalKey = (processPath?: string, origin?: string): string => {
	return `${processPath || ''}\u0000${origin || ''}`;
};

class LinkApprovalManager {

	handlers: LinkApprovalHandlers;
	current: Entry | null = null;
	queue: Entry[] = [];
	timeout: any = null;

	constructor (handlers: LinkApprovalHandlers) {
		this.handlers = handlers;
	};

	/** A renderer reported Event.Account.LinkApprovalRequest. Every session receives it, so the same
	 * request arrives once per window/tab. */
	request (request: ApprovalRequest, sourceId: number): void {
		const { processPath, origin } = request.clientInfo || {};
		const key = approvalKey(processPath, origin);

		if (this.find(key)) {
			return;
		};

		const entry: Entry = { key, request, sourceId };

		if (this.current) {
			this.queue.push(entry);
		} else {
			this.present(entry);
		};
	};

	/** The user pressed Allow or Deny in the approval window. The RPC lives in the renderer — main has
	 * no gRPC session — so the decision is relayed to a full-scope session to be sent on. */
	decide (param: { processPath?: string; origin?: string; allow: boolean }): void {
		const { processPath, origin, allow } = param;
		const key = approvalKey(processPath, origin);

		if (!this.current || (this.current.key != key) || this.current.decided) {
			return;
		};

		const targets = this.relayTargets(this.current.sourceId);
		const sent = targets.some(id => this.handlers.sendDecision(id, { processPath, origin, allow }));

		if (!sent) {
			// nothing left to send through: heart expires the pending request on its own
			this.drop(key);
			return;
		};

		this.current.decided = true;
	};

	/** The relaying renderer got the AccountLocalLinkApproveChallenge response back. */
	result (param: { processPath?: string; origin?: string; challenge?: string; error?: any }): void {
		const { processPath, origin, challenge, error } = param;
		const key = approvalKey(processPath, origin);

		if (!this.current || (this.current.key != key)) {
			return;
		};

		if (error || !challenge) {
			this.drop(key);
			return;
		};

		this.handlers.code(key, challenge);
		this.setBackstop(key, CODE_BACKSTOP_MS);
	};

	/** Event.Account.LinkApprovalHide: the request was solved, denied or expired. */
	hide (clientInfo: ClientInfo): void {
		const { processPath, origin } = clientInfo || {};

		this.drop(approvalKey(processPath, origin));
	};

	private find (key: string): Entry | null {
		if (this.current && (this.current.key == key)) {
			return this.current;
		};

		return this.queue.find(it => it.key == key) || null;
	};

	/** The renderer that reported the request first, then any other live one: heart accepts the
	 * decision from any full-scope session. */
	private relayTargets (sourceId: number): number[] {
		const live = this.handlers.liveTargets() || [];

		return live.includes(sourceId) ? [ sourceId, ...live.filter(id => id != sourceId) ] : live;
	};

	private present (entry: Entry): void {
		this.current = entry;
		this.handlers.open({ ...entry.request, key: entry.key });
		this.setBackstop(entry.key, PENDING_BACKSTOP_MS);
	};

	private setBackstop (key: string, timeout: number): void {
		this.clearBackstop();
		this.timeout = setTimeout(() => this.drop(key), timeout);
	};

	private clearBackstop (): void {
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = null;
		};
	};

	private drop (key: string): void {
		if (this.current && (this.current.key == key)) {
			this.current = null;
			this.clearBackstop();
			this.handlers.close(key);
			this.advance();
			return;
		};

		this.queue = this.queue.filter(it => it.key != key);
	};

	private advance (): void {
		const next = this.queue.shift();

		if (next) {
			this.present(next);
		};
	};

};

export { LinkApprovalManager };
export default LinkApprovalManager;
