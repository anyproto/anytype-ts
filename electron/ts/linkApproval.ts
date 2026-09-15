import type { LinkClientInfo as ClientInfo, LinkApprovalRequest as ApprovalRequest, LinkApprovalPayload as ApprovalPayload, LinkApprovalDecision, LinkApprovalSpace } from '../../src/ts/interface/linkApproval';
import { isValidLinkGrant } from '../../src/ts/lib/linkApprovalGrant';

export type { ClientInfo, ApprovalRequest, ApprovalPayload };

/** Everything the manager needs from the outside world, injected so the queue logic stays testable
 * without Electron. */
export interface LinkApprovalHandlers {
	open (payload: ApprovalPayload): void;
	close (key: string): void;
	code (key: string, challenge: string): void;
	error (key: string): void;
	spaces (key: string, spaces: LinkApprovalSpace[]): void;
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
 * cannot strand an always-on-top window, and sit above heart's own 180s / 5min expiry. */
export const PENDING_BACKSTOP_MS = 210 * 1000;
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
	decide (param: LinkApprovalDecision): void {
		const { processPath, origin, allow, grant } = param;
		const key = approvalKey(processPath, origin);

		if (!this.current || (this.current.key != key) || this.current.decided) {
			return;
		};

		// JsonAPI grants are chosen in the desktop. Limited (clipper) requests carry no grant.
		const isJson = this.current.request.scope == 1;
		const available = new Set((this.current.request.spaces || []).map(space => space.id));
		if (allow && (isJson ? (
			!isValidLinkGrant(grant) || grant.spaceIds.some(id => !available.has(id))
		) : (this.current.request.scope != 0 || !!grant))) {
			this.handlers.error(key);
			return;
		};

		const decision: LinkApprovalDecision = { processPath, origin, allow };
		if (allow && isJson) {
			decision.grant = { ...grant, spaceIds: [ ...grant.spaceIds ] };
		};

		const targets = this.relayTargets(this.current.sourceId);
		const sent = targets.some(id => this.handlers.sendDecision(id, decision));

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

		// BAD_INPUT leaves the challenge pending in Heart. Let the user correct the grant.
		if (error?.code == 2) {
			this.current.decided = false;
			this.handlers.error(key);
			return;
		};

		if (error || !challenge) {
			this.drop(key);
			return;
		};

		this.handlers.code(key, challenge);
		this.setBackstop(key, CODE_BACKSTOP_MS);
	};

	/** Keep an open picker in sync with its reporting renderer's account catalog. */
	updateSpaces (sourceId: number, spaces: LinkApprovalSpace[]): void {
		const live = new Set(this.handlers.liveTargets());
		[ this.current, ...this.queue ].filter(Boolean).forEach(entry => {
			if (entry.sourceId != sourceId) {
				if (live.has(entry.sourceId) || !live.has(sourceId)) {
					return;
				};
				entry.sourceId = sourceId;
			};
			entry.request.spaces = spaces;
			if (entry == this.current) {
				this.handlers.spaces(entry.key, spaces);
			};
		});
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
