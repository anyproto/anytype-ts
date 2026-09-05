import { observable, action, computed, makeObservable } from 'mobx';
import * as I from 'Interface';

const LINES_LIMIT = 3;
const EVENTS_LIMIT = 2000;
const BUFFER_LIMIT = 2000;
const TIMEOUT_PULL = 10000;
const KNOWN_PHASES = new Set<number>(Object.values(I.RecoveryPhase).filter(it => typeof it == 'number') as number[]);
const KNOWN_LOCAL_PEERS = new Set<number>(Object.values(I.RecoveryLocalPeersState).filter(it => typeof it == 'number') as number[]);

/**
 * Account start-up status (recovery events).
 *
 * Folds `Event.Account.Recovery.Update` into the same state the middleware serves through
 * `Rpc.Account.RecoveryState`, and keeps a short ticker of lines for the loading screens.
 *
 * Gating follows the client integration guide: apply an update only when `id == lastId + 1`
 * within the current `runId`; on a gap re-pull the snapshot and replace local state; on a new
 * `runId` reset. Every payload is a level, so re-applying after a re-pull is harmless.
 */
export class RecoveryStore {

	public runId = '';
	public lastId = 0;
	public mode: I.RecoveryMode = I.RecoveryMode.Unknown;
	public networkId = '';
	public startedAtMs = 0;
	public phase: I.RecoveryPhase = I.RecoveryPhase.LookingForPeers;
	public phaseStartedAtMs = 0;
	public done = false;
	public error: I.RecoveryError = null;
	public discovery: I.RecoveryDiscoveryState = I.RecoveryDiscoveryState.Possible;
	public accountFetchStarted = false;
	public accountReady = false;
	public accountFetchAttempt = 0;
	public accountFetchError: I.RecoveryError = null;
	public peers: Map<string, I.RecoveryPeer> = new Map();
	public spaces: Map<string, I.RecoverySpace> = new Map();
	public spacesTotal = 0;
	public spacesLoaded = 0;
	public spacesFailed = 0;
	public viewsConfirmed = false;
	public localPeers: I.RecoveryLocalPeersState = I.RecoveryLocalPeersState.NoLocalPeers;
	public lines: I.RecoveryLine[] = [];

	/* For the debug dump: every update received in arrival order (bounded), and the last snapshot applied */
	public events: I.RecoveryUpdate[] = [];
	public lastSnapshot: I.RecoverySnapshot = null;

	private lineId = 0;
	private prevRunId = '';
	private isPulling = false;
	private pullFailed = false;
	private pullGeneration = 0;
	private timeoutPull = 0;
	private buffer: I.RecoveryUpdate[] = [];

	constructor () {
		makeObservable(this, {
			runId: observable,
			mode: observable,
			phase: observable,
			done: observable,
			error: observable,
			accountReady: observable,
			accountFetchAttempt: observable,
			peers: observable,
			spaces: observable,
			spacesTotal: observable,
			spacesLoaded: observable,
			spacesFailed: observable,
			viewsConfirmed: observable,
			localPeers: observable,
			lines: observable,
			isActive: computed,
			isTerminal: computed,
			apply: action,
			applySnapshot: action,
			onPull: action,
			reset: action,
		});
	};

	/** The run reached Done or Failed; nothing more will be emitted for it */
	get isTerminal (): boolean {
		return this.done || (this.phase == I.RecoveryPhase.Failed);
	};

	/** A run is known and still going: the ticker shows a live indicator */
	get isActive (): boolean {
		return !!this.runId && !this.isTerminal;
	};

	/**
	 * Applies one update from the event stream.
	 * @param {I.RecoveryUpdate} update - The mapped update.
	 */
	apply (update: I.RecoveryUpdate) {
		if (!update || !update.runId) {
			return;
		};

		// Logged after the buffering decision, so a drained update is not recorded twice and the
		// dump keeps wire order
		if (this.isPulling) {
			// Capped like the debug log: a pull that answers late must not grow this without end
			if (this.buffer.length < BUFFER_LIMIT) {
				this.buffer.push(update);
			};
			return;
		};

		this.logEvent(update);

		if (update.runId != this.runId) {
			// Only a run's own opening (or a snapshot) may replace the current one. A late update
			// from the previous run would otherwise discard the new run and restart the ticker
			if ((update.id == 1) && (update.type == I.RecoveryUpdateType.Started)) {
				this.reset(update.runId);
			} else
			if (update.type == I.RecoveryUpdateType.Snapshot) {
				this.applySnapshot(update.data);
				return;
			} else
			if (update.runId == this.prevRunId) {
				// The tail of the run we just left: nothing to learn from it, and pulling would
				// freeze the live run's ticker for a round trip
				return;
			} else {
				// News about a run we do not have - its Started was lost in a gap. Only the
				// snapshot can say where that run stands, whatever state the last one ended in
				this.pull();
				return;
			};
		} else
		if (update.type == I.RecoveryUpdateType.Snapshot) {
			this.applySnapshot(update.data);
			return;
		};

		if (update.id == this.lastId + 1) {
			this.fold(update);
			this.lastId = update.id;
		} else
		if (update.id > this.lastId + 1) {
			if (this.pullFailed || !this.isRecoveryNeeded()) {
				// Accept the gap rather than pull: the snapshot RPC is not answering (older
				// middleware, transient failure), or the run is over and a snapshot would only
				// cost the middleware work. Every payload is a level anyway
				this.fold(update);
				this.lastId = update.id;
			} else {
				this.pull();
			};
		};
	};

	/**
	 * Whether a snapshot is still worth asking the middleware for: only while a run is live.
	 * A warm start attaches before the run begins and never pulls; once the run is done or failed
	 * its state cannot change, so a gap is folded instead.
	 * @returns {boolean} True if the run may still have something to tell us.
	 */
	isRecoveryNeeded (): boolean {
		return !this.done && (this.phase != I.RecoveryPhase.Failed);
	};

	/**
	 * Replaces local state with a folded snapshot (RPC result or snapshot-on-attach).
	 * @param {I.RecoverySnapshot} snapshot - The snapshot.
	 */
	applySnapshot (snapshot: I.RecoverySnapshot) {
		if (!snapshot || !snapshot.runId) {
			return;
		};

		if (snapshot.runId != this.runId) {
			this.reset(snapshot.runId);
		} else
		if (snapshot.lastEventId < this.lastId) {
			// Live updates already carried us past this snapshot
			return;
		};

		this.lastSnapshot = snapshot;
		this.lastId = snapshot.lastEventId;
		this.mode = snapshot.mode;
		this.networkId = snapshot.networkId;
		this.startedAtMs = snapshot.startedAtMs;
		this.phase = KNOWN_PHASES.has(snapshot.phase) ? snapshot.phase : this.phase;
		this.phaseStartedAtMs = snapshot.phaseStartedAtMs;
		this.done = snapshot.done;
		this.error = snapshot.error || null;
		this.discovery = snapshot.discovery;
		this.accountFetchStarted = snapshot.accountFetchStarted;
		this.accountReady = snapshot.accountReady;
		this.accountFetchAttempt = snapshot.accountFetchAttempt;
		this.accountFetchError = snapshot.accountFetchError || null;
		this.spacesTotal = snapshot.spacesTotal;
		this.spacesLoaded = snapshot.spacesLoaded;
		this.spacesFailed = snapshot.spacesFailed;
		this.viewsConfirmed = snapshot.viewsConfirmed;
		this.localPeers = KNOWN_LOCAL_PEERS.has(snapshot.localPeers) ? snapshot.localPeers : I.RecoveryLocalPeersState.NoLocalPeers;

		this.peers.clear();
		for (const peer of (snapshot.peers || [])) {
			this.peers.set(peer.peerId, { ...peer });
		};

		this.spaces.clear();
		for (const space of (snapshot.spaces || [])) {
			if (space.state != I.RecoverySpaceState.Removed) {
				this.spaces.set(space.spaceId, { ...space });
			};
		};

		this.rebuildLines();
	};

	/**
	 * Pulls the snapshot through Rpc.Account.RecoveryState. Safe to call while AccountSelect
	 * blocks. Updates that arrive meanwhile are buffered and drained after the answer.
	 */
	pull () {
		if (this.isPulling) {
			return;
		};

		const generation = ++this.pullGeneration;

		this.isPulling = true;

		// A request that never answers (a synchronous throw inside the dispatcher, a stalled
		// unary) would otherwise buffer every later update forever and freeze the run
		window.clearTimeout(this.timeoutPull);
		this.timeoutPull = window.setTimeout(() => this.onPull({ error: { code: 1, description: 'Timeout' } }, generation), TIMEOUT_PULL);

		C.AccountRecoveryState((message: any) => this.onPull(message, generation));
	};

	/**
	 * Handles the snapshot RPC answer and drains the buffered updates.
	 * @param {any} message - The RPC response.
	 * @param {number} [generation] - The pull this answer belongs to.
	 */
	onPull (message: any, generation?: number) {
		// An answer that crossed a reset (logout, a new run) describes a state that is gone; the
		// bump retires this generation too, so the timeout and the real answer cannot both land
		if ((generation !== undefined) && (generation != this.pullGeneration)) {
			return;
		};

		this.pullGeneration++;

		const code = Number(message?.error?.code) || 0;

		// Taken before anything below can reset(), which empties it
		const buffer = this.buffer;

		window.clearTimeout(this.timeoutPull);
		this.isPulling = false;
		this.buffer = [];

		if (!code) {
			this.pullFailed = false;

			if (message.snapshot?.runId) {
				this.applySnapshot(message.snapshot);
			} else {
				// The idle snapshot: no run has begun in this process, render nothing
				this.reset();
			};
		} else
		if (code == J.Error.Code.AccountRecoveryState.ACCOUNT_IS_NOT_RUNNING) {
			// Older middleware before the RPC became total: same meaning as the idle snapshot
			this.pullFailed = false;
			this.reset();
		} else {
			console.warn('[Recovery.onPull]', code, message?.error?.description);
			this.pullFailed = true;
		};

		for (const update of buffer) {
			this.apply(update);
		};
	};

	/**
	 * Clears the state, optionally starting a new run.
	 * @param {string} [runId] - The new run id.
	 */
	reset (runId?: string) {
		// A pull in flight belongs to the state being thrown away: retire it, drop what it
		// buffered, and let the next run pull again however the last one ended
		window.clearTimeout(this.timeoutPull);
		this.pullGeneration++;
		this.isPulling = false;
		this.pullFailed = false;
		this.buffer = [];

		this.prevRunId = this.runId;
		this.runId = String(runId || '');
		this.lastId = 0;
		this.mode = I.RecoveryMode.Unknown;
		this.networkId = '';
		this.startedAtMs = 0;
		this.phase = I.RecoveryPhase.LookingForPeers;
		this.phaseStartedAtMs = 0;
		this.done = false;
		this.error = null;
		this.discovery = I.RecoveryDiscoveryState.Possible;
		this.accountFetchStarted = false;
		this.accountReady = false;
		this.accountFetchAttempt = 0;
		this.accountFetchError = null;
		this.spacesTotal = 0;
		this.spacesLoaded = 0;
		this.spacesFailed = 0;
		this.viewsConfirmed = false;
		this.localPeers = I.RecoveryLocalPeersState.NoLocalPeers;
		this.lines = [];

		// lineId deliberately keeps counting: a second run started while the block is still
		// mounted would otherwise reuse React keys, and the drum would swap its lines without
		// playing either animation
		this.peers.clear();
		this.spaces.clear();
	};

	/**
	 * Clears the state and the diagnostics with it. For logout: the debug log outlives a run
	 * change (the previous run's tail is context) but not a change of account.
	 */
	clear () {
		this.reset();

		this.events = [];
		this.lastSnapshot = null;
	};

	/**
	 * Everything needed to reason about a start-up run after the fact: the folded state, the last
	 * snapshot applied and every update received. Plain data, safe to stringify.
	 * @returns {any} The debug dump.
	 */
	getDebugInfo (): any {
		return {
			collectedAt: new Date().toISOString(),
			state: {
				runId: this.runId,
				lastId: this.lastId,
				mode: this.mode,
				networkId: this.networkId,
				startedAtMs: this.startedAtMs,
				phase: this.phase,
				phaseStartedAtMs: this.phaseStartedAtMs,
				done: this.done,
				error: this.error,
				discovery: this.discovery,
				accountFetchStarted: this.accountFetchStarted,
				accountReady: this.accountReady,
				accountFetchAttempt: this.accountFetchAttempt,
				accountFetchError: this.accountFetchError,
				localPeers: this.localPeers,
				spacesTotal: this.spacesTotal,
				spacesLoaded: this.spacesLoaded,
				spacesFailed: this.spacesFailed,
				viewsConfirmed: this.viewsConfirmed,
				peers: Array.from(this.peers.values()),
				spaces: Array.from(this.spaces.values()),
			},
			lastSnapshot: this.lastSnapshot,
			events: this.events,
		};
	};

	/**
	 * Copies the debug dump to the clipboard with a toast.
	 */
	copyDebugInfo () {
		U.Common.copyToast(translate('recoveryStatusDebugLabel'), JSON.stringify(this.getDebugInfo(), null, 2));
	};

	private logEvent (update: I.RecoveryUpdate) {
		this.events.push(update);

		// Trimmed in blocks: one splice per event past the limit would memmove the whole array
		// on every update of a noisy run
		if (this.events.length > EVENTS_LIMIT * 1.25) {
			this.events.splice(0, this.events.length - EVENTS_LIMIT);
		};
	};

	/**
	 * Gets the user-facing channel counts: tech space and removed spaces excluded.
	 * @returns {{ loaded: number; total: number }} The counts.
	 */
	getChannelCounts (): { loaded: number; total: number } {
		let loaded = 0;
		let total = 0;

		for (const space of this.spaces.values()) {
			if ((space.kind == I.RecoverySpaceKind.Tech) || (space.state == I.RecoverySpaceState.Removed)) {
				continue;
			};

			total++;

			if (space.state == I.RecoverySpaceState.Loaded) {
				loaded++;
			};
		};

		return { loaded, total };
	};

	private fold (update: I.RecoveryUpdate) {
		const data = update.data || {};

		switch (update.type) {
			case I.RecoveryUpdateType.Started: {
				this.mode = Number(data.mode) || I.RecoveryMode.Unknown;
				this.networkId = String(data.networkId || '');
				this.startedAtMs = update.timestampMs;
				this.phase = I.RecoveryPhase.LookingForPeers;
				this.phaseStartedAtMs = update.timestampMs;
				this.lines = [];

				if (this.mode == I.RecoveryMode.Cold) {
					this.pushLine({ type: I.RecoveryLineType.ColdStart });
				};

				this.pushPhaseLine(this.phase);
				break;
			};

			case I.RecoveryUpdateType.PhaseChanged: {
				const phase = Number(data.phase);

				if (!KNOWN_PHASES.has(phase)) {
					// Unknown phase: keep the previous label
					break;
				};

				this.phase = phase;
				this.phaseStartedAtMs = update.timestampMs;

				switch (phase) {
					case I.RecoveryPhase.WaitingForNetwork: {
						this.error = data.error || null;
						this.pushPhaseLine(phase, this.error?.class);
						break;
					};

					case I.RecoveryPhase.Failed: {
						// The AccountSelect error is the surface for this; the ticker just freezes
						this.error = data.error || null;
						break;
					};

					case I.RecoveryPhase.Done: {
						this.error = null;
						this.done = true;
						this.pushFinishedLine();
						break;
					};

					case I.RecoveryPhase.NotStarted: {
						// The idle phase is a snapshot artefact, never a stage to show
						break;
					};

					default: {
						this.error = null;

						if (!this.isPhaseRedundant(phase)) {
							this.pushPhaseLine(phase);
						};
						break;
					};
				};
				break;
			};

			case I.RecoveryUpdateType.LocalDiscoveryState: {
				this.discovery = Number(data.state) || I.RecoveryDiscoveryState.Possible;
				break;
			};

			case I.RecoveryUpdateType.PeerDiscovered: {
				const peer = this.getPeer(data.peerId, data.kind, data.nodeTypes);

				peer.discoveredLocally = peer.kind == I.RecoveryPeerKind.Local;
				break;
			};

			case I.RecoveryUpdateType.DialStarted: {
				this.getPeer(data.peerId, data.kind, data.nodeTypes);
				break;
			};

			case I.RecoveryUpdateType.PeerConnected: {
				const peer = this.getPeer(data.peerId, data.kind, data.nodeTypes);

				peer.openConnections = Number(data.openConnections) || 0;
				peer.transport = String(data.transport || '');
				peer.protoVersion = Number(data.protoVersion) || 0;
				peer.dialAttempts = 0;
				peer.lastError = null;
				break;
			};

			case I.RecoveryUpdateType.DialFailed: {
				const peer = this.getPeer(data.peerId, data.kind, data.nodeTypes);

				peer.dialAttempts = Number(data.attempt) || 0;
				peer.lastError = data.error || null;
				break;
			};

			case I.RecoveryUpdateType.PeerDisconnected: {
				const peer = this.getPeer(data.peerId, data.kind, data.nodeTypes);

				peer.openConnections = Number(data.openConnections) || 0;
				break;
			};

			case I.RecoveryUpdateType.AccountFetchStarted: {
				this.accountFetchStarted = true;
				this.accountFetchAttempt = Number(data.attempt) || 0;

				// Phases are not monotone: a retry announced after the run moved on must not
				// rewrite the number on a line that is already history
				if (this.phase != I.RecoveryPhase.FetchingAccount) {
					break;
				};

				const line = this.findPhaseLine(I.RecoveryPhase.FetchingAccount);

				if (line) {
					// A new pull round is "still trying": update the line in place, wherever it
					// sits - a LAN line landing meanwhile must not turn this into a second line
					line.attempt = this.accountFetchAttempt;
				} else {
					this.pushPhaseLine(this.phase);
				};
				break;
			};

			case I.RecoveryUpdateType.AccountFetchError: {
				this.accountFetchError = data.error || null;
				break;
			};

			case I.RecoveryUpdateType.AccountReady: {
				this.accountReady = true;
				this.accountFetchError = null;
				break;
			};

			case I.RecoveryUpdateType.SpaceDiscovered: {
				const space = this.getSpace(data.spaceId);

				if (data.spaceViewId) {
					space.spaceViewId = String(data.spaceViewId);
				};

				// Tech is sticky: a repeated SpaceDiscovered may leave kind at its zero value, and
				// a tech space counted as a channel would skew every total
				if (Number(data.kind) == I.RecoverySpaceKind.Tech) {
					space.kind = I.RecoverySpaceKind.Tech;
				};

				this.updateChannelLine();
				break;
			};

			case I.RecoveryUpdateType.SpaceStateChanged: {
				const state = Number(data.state) || I.RecoverySpaceState.Queued;

				if (state == I.RecoverySpaceState.Removed) {
					this.spaces.delete(String(data.spaceId || ''));
				} else {
					const space = this.getSpace(data.spaceId);

					space.state = state;
					space.error = data.error || null;
					space.attempt = Number(data.attempt) || 0;
				};

				this.updateChannelLine();
				break;
			};

			case I.RecoveryUpdateType.Finished: {
				this.done = true;
				this.spacesTotal = Number(data.spacesTotal) || 0;
				this.spacesLoaded = Number(data.spacesLoaded) || 0;
				this.spacesFailed = Number(data.spacesFailed) || 0;
				this.viewsConfirmed = Boolean(data.viewsConfirmed);
				this.pushFinishedLine();
				break;
			};

			case I.RecoveryUpdateType.PeerSpaceExchange: {
				// A fact per LAN peer, kept for the detail view; the headline is LocalPeersStateChanged
				const peer = this.getPeer(data.peerId);

				peer.exchanged = Boolean(data.exchanged);
				peer.hasAccountSpace = peer.exchanged && Boolean(data.hasAccountSpace);
				peer.sharedSpaceCount = peer.exchanged ? (Number(data.sharedSpaceCount) || 0) : 0;
				break;
			};

			case I.RecoveryUpdateType.LocalPeersStateChanged: {
				const state = Number(data.state);

				if (!KNOWN_LOCAL_PEERS.has(state)) {
					// Unknown state: keep the previous one
					break;
				};

				this.localPeers = state;
				this.pushLocalPeersLine(state);
				break;
			};

			default: {
				// Unknown payload kind: not a breaking change, ignore
				break;
			};
		};
	};

	private getPeer (peerId: string, kind?: number, nodeTypes?: string[]): I.RecoveryPeer {
		const id = String(peerId || '');

		let peer = this.peers.get(id);

		if (!peer) {
			peer = {
				peerId: id,
				kind: I.RecoveryPeerKind.Local,
				nodeTypes: [],
				openConnections: 0,
				transport: '',
				protoVersion: 0,
				dialAttempts: 0,
				lastError: null,
				discoveredLocally: false,
				exchanged: false,
				hasAccountSpace: false,
				sharedSpaceCount: 0,
			};

			this.peers.set(id, peer);
			peer = this.peers.get(id);
		};

		if (kind !== undefined) {
			peer.kind = Number(kind) || I.RecoveryPeerKind.Local;
		};

		if (nodeTypes && nodeTypes.length) {
			peer.nodeTypes = nodeTypes;
		};

		return peer;
	};

	private getSpace (spaceId: string): I.RecoverySpace {
		const id = String(spaceId || '');

		let space = this.spaces.get(id);

		if (!space) {
			space = {
				spaceId: id,
				spaceViewId: '',
				kind: I.RecoverySpaceKind.Regular,
				state: I.RecoverySpaceState.Queued,
				error: null,
				attempt: 0,
			};

			this.spaces.set(id, space);
			space = this.spaces.get(id);
		};

		return space;
	};

	/** The most recent line for a phase, wherever it sits in the drum */
	private findPhaseLine (phase: I.RecoveryPhase): I.RecoveryLine {
		for (let i = this.lines.length - 1; i >= 0; i--) {
			const line = this.lines[i];

			if ((line.type == I.RecoveryLineType.Phase) && (line.phase == phase)) {
				return line;
			};
		};

		return null;
	};

	private getLastLine (): I.RecoveryLine {
		return this.lines.length ? this.lines[this.lines.length - 1] : null;
	};

	private pushLine (line: Partial<I.RecoveryLine>) {
		this.lines.push({ type: I.RecoveryLineType.Phase, ...line, id: ++this.lineId });

		if (this.lines.length > LINES_LIMIT) {
			this.lines.splice(0, this.lines.length - LINES_LIMIT);
		};
	};

	private pushPhaseLine (phase: I.RecoveryPhase, errorClass?: I.RecoveryErrorClass) {
		if (!KNOWN_PHASES.has(phase) || (phase == I.RecoveryPhase.NotStarted)) {
			return;
		};

		const { loaded, total } = this.getChannelCounts();

		this.pushLine({
			type: I.RecoveryLineType.Phase,
			phase,
			errorClass: errorClass || I.RecoveryErrorClass.None,
			attempt: (phase == I.RecoveryPhase.FetchingAccount) ? this.accountFetchAttempt : 0,
			loaded,
			total,
		});
	};

	private pushFinishedLine () {
		const last = this.getLastLine();

		if (last && (last.type == I.RecoveryLineType.Finished)) {
			last.viewsConfirmed = this.viewsConfirmed;
		} else {
			this.pushLine({ type: I.RecoveryLineType.Finished, viewsConfirmed: this.viewsConfirmed });
		};
	};

	/** "Connecting" right after "Found a device on your network, connecting" says nothing new */
	private isPhaseRedundant (phase: I.RecoveryPhase): boolean {
		const last = this.getLastLine();

		return (phase == I.RecoveryPhase.Connecting) && last && (last.type == I.RecoveryLineType.LocalPeers) && (last.localPeers == I.RecoveryLocalPeersState.Connecting);
	};

	private pushLocalPeersLine (state: I.RecoveryLocalPeersState) {
		const last = this.getLastLine();

		// Nothing on the LAN is not a headline; a repeated state is not news
		if (state == I.RecoveryLocalPeersState.NoLocalPeers) {
			return;
		};

		if (last && (last.type == I.RecoveryLineType.LocalPeers) && (last.localPeers == state)) {
			return;
		};

		this.pushLine({ type: I.RecoveryLineType.LocalPeers, localPeers: state });
	};

	private updateChannelLine () {
		// Only while the run is still on that phase: counts must not keep moving on a line the
		// drum has already left behind
		if (this.phase != I.RecoveryPhase.LoadingSpaces) {
			return;
		};

		// Found by phase, not by position: a LAN line arriving mid-load used to freeze the counts
		const line = this.findPhaseLine(I.RecoveryPhase.LoadingSpaces);

		if (line) {
			const { loaded, total } = this.getChannelCounts();

			line.loaded = loaded;
			line.total = total;
		};
	};

	private rebuildLines () {
		this.lines = [];

		if (this.done) {
			this.pushFinishedLine();
			return;
		};

		if ([ I.RecoveryPhase.Failed, I.RecoveryPhase.NotStarted ].includes(this.phase)) {
			return;
		};

		// The LAN headline is news while still connecting and background afterwards
		const isConnecting = [ I.RecoveryPhase.LookingForPeers, I.RecoveryPhase.Connecting ].includes(this.phase);

		if (!isConnecting) {
			this.pushLocalPeersLine(this.localPeers);
		};

		this.pushPhaseLine(this.phase, (this.phase == I.RecoveryPhase.WaitingForNetwork) ? this.error?.class : undefined);

		if (isConnecting) {
			this.pushLocalPeersLine(this.localPeers);
		};
	};

};

export const Recovery: RecoveryStore = new RecoveryStore();
