import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecoveryStore } from './recovery';
import * as I from 'Interface';

const RUN = 'run-1';
const NOT_RUNNING = 101;

const update = (id: number, type: I.RecoveryUpdateType | string, data: any = {}, runId = RUN): I.RecoveryUpdate => ({ runId, id, timestampMs: id * 100, type, data });

const phase = (id: number, value: I.RecoveryPhase, extra: any = {}, runId = RUN) => update(id, I.RecoveryUpdateType.PhaseChanged, { phase: value, ...extra }, runId);

const snapshot = (overrides: Partial<I.RecoverySnapshot> = {}): I.RecoverySnapshot => ({
	runId: RUN,
	lastEventId: 0,
	mode: I.RecoveryMode.Warm,
	networkId: '',
	startedAtMs: 0,
	phase: I.RecoveryPhase.LookingForPeers,
	phaseStartedAtMs: 0,
	done: false,
	error: null,
	discovery: I.RecoveryDiscoveryState.Possible,
	accountFetchStarted: false,
	accountReady: false,
	peers: [],
	spaces: [],
	spacesTotal: 0,
	spacesLoaded: 0,
	spacesFailed: 0,
	viewsConfirmed: false,
	accountFetchAttempt: 0,
	accountFetchError: null,
	localPeers: I.RecoveryLocalPeersState.NoLocalPeers,
	...overrides,
});

const localPeers = (id: number, state: I.RecoveryLocalPeersState | number, fromState: I.RecoveryLocalPeersState = I.RecoveryLocalPeersState.NoLocalPeers) => update(id, I.RecoveryUpdateType.LocalPeersStateChanged, { state, fromState });

const lineTypes = (store: RecoveryStore) => store.lines.map(it => it.type);
const linePhases = (store: RecoveryStore) => store.lines.map(it => it.phase);

describe('RecoveryStore', () => {

	let store: RecoveryStore;
	let rpc: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		rpc = vi.fn();
		vi.stubGlobal('C', { AccountRecoveryState: rpc });
		vi.stubGlobal('J', { Error: { Code: { AccountRecoveryState: { ACCOUNT_IS_NOT_RUNNING: NOT_RUNNING } } } });
		store = new RecoveryStore();
	});

	describe('folding', () => {

		it('walks a warm start and counts channels without the tech space', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));
			store.apply(phase(2, I.RecoveryPhase.Connecting));
			store.apply(update(3, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 'tech', kind: I.RecoverySpaceKind.Tech }));
			store.apply(update(4, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 's1' }));
			store.apply(update(5, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 's2' }));
			store.apply(phase(6, I.RecoveryPhase.LoadingSpaces));

			expect(store.mode).toBe(I.RecoveryMode.Warm);
			expect(store.phase).toBe(I.RecoveryPhase.LoadingSpaces);
			expect(linePhases(store)).toEqual([ I.RecoveryPhase.LookingForPeers, I.RecoveryPhase.Connecting, I.RecoveryPhase.LoadingSpaces ]);
			expect(store.lines[2]).toMatchObject({ loaded: 0, total: 2 });

			store.apply(update(7, I.RecoveryUpdateType.SpaceStateChanged, { spaceId: 'tech', state: I.RecoverySpaceState.Loaded }));
			store.apply(update(8, I.RecoveryUpdateType.SpaceStateChanged, { spaceId: 's1', state: I.RecoverySpaceState.Loaded }));

			expect(store.lines.length).toBe(3);
			expect(store.lines[2]).toMatchObject({ loaded: 1, total: 2 });
			expect(store.isActive).toBe(true);

			store.apply(update(9, I.RecoveryUpdateType.Finished, { spacesTotal: 3, spacesLoaded: 3, spacesFailed: 0, viewsConfirmed: true }));

			expect(store.done).toBe(true);
			expect(store.isActive).toBe(false);
			expect(store.lastId).toBe(9);
			expect(store.lines.length).toBe(3);
			expect(store.lines[2]).toMatchObject({ type: I.RecoveryLineType.Finished, viewsConfirmed: true });
		});

		it('opens a cold start with a framing line and updates fetch attempts in place', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }));

			expect(lineTypes(store)).toEqual([ I.RecoveryLineType.ColdStart, I.RecoveryLineType.Phase ]);

			store.apply(phase(2, I.RecoveryPhase.Connecting));
			store.apply(phase(3, I.RecoveryPhase.FetchingAccount));
			store.apply(update(4, I.RecoveryUpdateType.AccountFetchStarted, { attempt: 1 }));

			expect(store.lines.length).toBe(3);
			expect(linePhases(store)).toEqual([ I.RecoveryPhase.LookingForPeers, I.RecoveryPhase.Connecting, I.RecoveryPhase.FetchingAccount ]);
			expect(store.lines[2].attempt).toBe(1);

			store.apply(update(5, I.RecoveryUpdateType.AccountFetchError, { error: { class: I.RecoveryErrorClass.PeerUnreachable, retryable: true, debugMessage: 'x' } }));
			store.apply(update(6, I.RecoveryUpdateType.AccountFetchStarted, { attempt: 2 }));

			expect(store.lines.length).toBe(3);
			expect(store.lines[2].attempt).toBe(2);
			expect(store.accountFetchError.class).toBe(I.RecoveryErrorClass.PeerUnreachable);

			store.apply(update(7, I.RecoveryUpdateType.AccountReady, { durationMs: 1000 }));

			expect(store.accountReady).toBe(true);
			expect(store.accountFetchError).toBeNull();
		});

		it('shows the waiting-for-network overlay and the resumed phase after it', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));
			store.apply(phase(2, I.RecoveryPhase.Connecting));
			store.apply(phase(3, I.RecoveryPhase.WaitingForNetwork, {
				fromPhase: I.RecoveryPhase.Connecting,
				error: { class: I.RecoveryErrorClass.NoNetwork, retryable: true, debugMessage: '' },
			}));

			expect(store.phase).toBe(I.RecoveryPhase.WaitingForNetwork);
			expect(store.lines[2]).toMatchObject({ phase: I.RecoveryPhase.WaitingForNetwork, errorClass: I.RecoveryErrorClass.NoNetwork });
			expect(store.isActive).toBe(true);

			store.apply(phase(4, I.RecoveryPhase.Connecting, { fromPhase: I.RecoveryPhase.WaitingForNetwork }));

			expect(store.error).toBeNull();
			expect(linePhases(store)).toEqual([ I.RecoveryPhase.Connecting, I.RecoveryPhase.WaitingForNetwork, I.RecoveryPhase.Connecting ]);
		});

		it('freezes on Failed without adding a line', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));
			store.apply(phase(2, I.RecoveryPhase.Connecting));
			store.apply(phase(3, I.RecoveryPhase.Failed, { error: { class: I.RecoveryErrorClass.AccountDeleted, retryable: false, debugMessage: '' } }));

			expect(store.phase).toBe(I.RecoveryPhase.Failed);
			expect(store.error.class).toBe(I.RecoveryErrorClass.AccountDeleted);
			expect(store.isActive).toBe(false);
			expect(store.isTerminal).toBe(true);
			expect(linePhases(store)).toEqual([ I.RecoveryPhase.LookingForPeers, I.RecoveryPhase.Connecting ]);
		});

		it('keeps the previous label on an unknown phase and ignores unknown payload kinds', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));
			store.apply(phase(2, 42 as I.RecoveryPhase));

			expect(store.phase).toBe(I.RecoveryPhase.LookingForPeers);
			expect(store.lines.length).toBe(1);
			expect(store.lastId).toBe(2);

			store.apply(update(3, 'somethingNew', { foo: 1 }));

			expect(store.lastId).toBe(3);
			expect(store.lines.length).toBe(1);
		});

		it('treats SpaceDiscovered as idempotent and drops removed spaces from counts', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }));
			store.apply(phase(2, I.RecoveryPhase.LoadingSpaces));
			store.apply(update(3, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 's1' }));
			store.apply(update(4, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 's1', spaceViewId: 'view1' }));
			store.apply(update(5, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 's2' }));
			store.apply(update(6, I.RecoveryUpdateType.SpaceStateChanged, { spaceId: 's1', state: I.RecoverySpaceState.Pulling, attempt: 2 }));

			expect(store.spaces.size).toBe(2);
			expect(store.spaces.get('s1')).toMatchObject({ spaceViewId: 'view1', state: I.RecoverySpaceState.Pulling, attempt: 2 });
			expect(store.getChannelCounts()).toMatchObject({ loaded: 0, total: 2 });

			store.apply(update(7, I.RecoveryUpdateType.SpaceStateChanged, { spaceId: 's2', state: I.RecoverySpaceState.Removed }));

			expect(store.spaces.size).toBe(1);
			expect(store.getChannelCounts()).toMatchObject({ loaded: 0, total: 1 });
			expect(store.lines[store.lines.length - 1]).toMatchObject({ phase: I.RecoveryPhase.LoadingSpaces, loaded: 0, total: 1 });
		});

		it('tracks peers as levels', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));
			store.apply(update(2, I.RecoveryUpdateType.DialStarted, { peerId: 'p1', kind: I.RecoveryPeerKind.Network, nodeTypes: [ 'tree' ] }));
			store.apply(update(3, I.RecoveryUpdateType.DialFailed, { peerId: 'p1', kind: I.RecoveryPeerKind.Network, attempt: 3, error: { class: I.RecoveryErrorClass.PeerUnreachable, retryable: true, debugMessage: '' } }));

			expect(store.peers.get('p1')).toMatchObject({ kind: I.RecoveryPeerKind.Network, nodeTypes: [ 'tree' ], dialAttempts: 3 });

			store.apply(update(4, I.RecoveryUpdateType.PeerConnected, { peerId: 'p1', kind: I.RecoveryPeerKind.Network, openConnections: 2, transport: 'quic' }));

			expect(store.peers.get('p1')).toMatchObject({ openConnections: 2, transport: 'quic', dialAttempts: 0, lastError: null });

			store.apply(update(5, I.RecoveryUpdateType.PeerDisconnected, { peerId: 'p1', openConnections: 1 }));

			expect(store.peers.get('p1').openConnections).toBe(1);
		});

	});

	describe('local peers', () => {

		it('binds a headline to LocalPeersStateChanged and renders nothing for NoLocalPeers', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }));
			store.apply(phase(2, I.RecoveryPhase.Connecting));
			store.apply(localPeers(3, I.RecoveryLocalPeersState.Connecting));

			expect(store.localPeers).toBe(I.RecoveryLocalPeersState.Connecting);
			expect(store.lines[store.lines.length - 1]).toMatchObject({ type: I.RecoveryLineType.LocalPeers, localPeers: I.RecoveryLocalPeersState.Connecting });

			// The same state again is not news
			store.apply(localPeers(4, I.RecoveryLocalPeersState.Connecting, I.RecoveryLocalPeersState.Connecting));

			expect(lineTypes(store)).toEqual([ I.RecoveryLineType.Phase, I.RecoveryLineType.Phase, I.RecoveryLineType.LocalPeers ]);

			store.apply(localPeers(5, I.RecoveryLocalPeersState.AccountFound, I.RecoveryLocalPeersState.Connecting));

			expect(store.localPeers).toBe(I.RecoveryLocalPeersState.AccountFound);
			expect(store.lines[store.lines.length - 1]).toMatchObject({ type: I.RecoveryLineType.LocalPeers, localPeers: I.RecoveryLocalPeersState.AccountFound });
			expect(store.lines.length).toBe(3);

			store.apply(localPeers(6, I.RecoveryLocalPeersState.NoLocalPeers, I.RecoveryLocalPeersState.AccountFound));

			expect(store.localPeers).toBe(I.RecoveryLocalPeersState.NoLocalPeers);
			expect(store.lines[store.lines.length - 1].localPeers).toBe(I.RecoveryLocalPeersState.AccountFound);
			expect(store.lastId).toBe(6);
		});

		it('skips the Connecting phase line right after the LAN connecting line', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));
			store.apply(localPeers(2, I.RecoveryLocalPeersState.Connecting));
			store.apply(phase(3, I.RecoveryPhase.Connecting));

			expect(store.phase).toBe(I.RecoveryPhase.Connecting);
			expect(lineTypes(store)).toEqual([ I.RecoveryLineType.Phase, I.RecoveryLineType.LocalPeers ]);

			// After a settled LAN answer the phase line is news again
			store.apply(localPeers(4, I.RecoveryLocalPeersState.AccountNotFound, I.RecoveryLocalPeersState.Connecting));
			store.apply(phase(5, I.RecoveryPhase.WaitingForNetwork, { error: { class: I.RecoveryErrorClass.PeerUnreachable, retryable: true, debugMessage: '' } }));
			store.apply(phase(6, I.RecoveryPhase.Connecting, { fromPhase: I.RecoveryPhase.WaitingForNetwork }));

			expect(store.lines[store.lines.length - 1]).toMatchObject({ type: I.RecoveryLineType.Phase, phase: I.RecoveryPhase.Connecting });
		});

		it('keeps updating the channel count after a LAN line lands on top of it', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }));
			store.apply(phase(2, I.RecoveryPhase.LoadingSpaces));
			store.apply(update(3, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 's1' }));
			store.apply(update(4, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 's2' }));
			store.apply(localPeers(5, I.RecoveryLocalPeersState.AccountFound));

			// The cold-start line has already scrolled off: LookingForPeers, LoadingSpaces, LAN
			expect(lineTypes(store)).toEqual([ I.RecoveryLineType.Phase, I.RecoveryLineType.Phase, I.RecoveryLineType.LocalPeers ]);

			store.apply(update(6, I.RecoveryUpdateType.SpaceStateChanged, { spaceId: 's1', state: I.RecoverySpaceState.Loaded }));

			// The counts belong to the LoadingSpaces line, wherever it sits in the drum
			expect(store.lines[1]).toMatchObject({ phase: I.RecoveryPhase.LoadingSpaces, loaded: 1, total: 2 });
			expect(store.lines).toHaveLength(3);
		});

		it('updates the account fetch attempt in place across an intervening line', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }));
			store.apply(phase(2, I.RecoveryPhase.FetchingAccount));
			store.apply(update(3, I.RecoveryUpdateType.AccountFetchStarted, { attempt: 1 }));
			store.apply(localPeers(4, I.RecoveryLocalPeersState.Unreachable));
			store.apply(update(5, I.RecoveryUpdateType.AccountFetchStarted, { attempt: 2 }));

			// One line per phase still: the retry updated the existing one rather than pushing
			expect(lineTypes(store)).toEqual([ I.RecoveryLineType.Phase, I.RecoveryLineType.Phase, I.RecoveryLineType.LocalPeers ]);
			expect(store.lines[1]).toMatchObject({ phase: I.RecoveryPhase.FetchingAccount, attempt: 2 });
		});

		it('keeps the tech space kind when a later discovery omits it', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }));
			store.apply(update(2, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 'tech', kind: I.RecoverySpaceKind.Tech }));
			store.apply(update(3, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 'tech', spaceViewId: 'view' }));
			store.apply(update(4, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 's1' }));

			expect(store.spaces.get('tech').kind).toBe(I.RecoverySpaceKind.Tech);
			expect(store.getChannelCounts()).toMatchObject({ loaded: 0, total: 1 });
		});

		it('counts a stalled channel apart and stops reporting progress', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }));
			store.apply(phase(2, I.RecoveryPhase.LoadingSpaces));
			store.apply(update(3, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 's1' }));
			store.apply(update(4, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 's2' }));
			store.apply(update(5, I.RecoveryUpdateType.SpaceStateChanged, { spaceId: 's1', state: I.RecoverySpaceState.Loaded }));

			expect(store.isPending).toBe(true);

			store.apply(update(6, I.RecoveryUpdateType.SpaceStateChanged, { spaceId: 's2', state: I.RecoverySpaceState.Stalled }));

			// Finished never fires while a channel is stalled, so the run stays alive - but with
			// nothing in flight it must not read as ongoing progress
			expect(store.isActive).toBe(true);
			expect(store.isPending).toBe(false);
			expect(store.getChannelCounts()).toEqual({ loaded: 1, total: 2, stalled: 1, pending: 0 });
			expect(store.lines[store.lines.length - 1]).toMatchObject({ phase: I.RecoveryPhase.LoadingSpaces, loaded: 1, total: 2, stalled: 1 });

			// The load may still complete: the state changes again and progress resumes
			store.apply(update(7, I.RecoveryUpdateType.SpaceStateChanged, { spaceId: 's2', state: I.RecoverySpaceState.Loading }));

			expect(store.isPending).toBe(true);
			expect(store.getChannelCounts()).toEqual({ loaded: 1, total: 2, stalled: 0, pending: 1 });
		});

		it('keeps the previous state on an unknown value', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));
			store.apply(localPeers(2, I.RecoveryLocalPeersState.Unreachable));
			store.apply(localPeers(3, 42));

			expect(store.localPeers).toBe(I.RecoveryLocalPeersState.Unreachable);
			expect(store.lastId).toBe(3);
			expect(store.lines.length).toBe(2);
		});

		it('folds PeerSpaceExchange per peer without touching the headline', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));
			store.apply(update(2, I.RecoveryUpdateType.PeerConnected, { peerId: 'lan1', kind: I.RecoveryPeerKind.Local, openConnections: 1 }));
			store.apply(update(3, I.RecoveryUpdateType.PeerSpaceExchange, { peerId: 'lan1', exchanged: true, hasAccountSpace: true, sharedSpaceCount: 3 }));

			expect(store.peers.get('lan1')).toMatchObject({ exchanged: true, hasAccountSpace: true, sharedSpaceCount: 3 });
			expect(store.lines.length).toBe(1);

			// exchanged=false means no answer is known: the answer fields do not apply
			store.apply(update(4, I.RecoveryUpdateType.PeerSpaceExchange, { peerId: 'lan1', exchanged: false, hasAccountSpace: true, sharedSpaceCount: 3 }));

			expect(store.peers.get('lan1')).toMatchObject({ exchanged: false, hasAccountSpace: false, sharedSpaceCount: 0 });
		});

		it('rebuilds the LAN line from a snapshot around the phase line', () => {
			store.applySnapshot(snapshot({ lastEventId: 5, phase: I.RecoveryPhase.Connecting, localPeers: I.RecoveryLocalPeersState.Connecting }));

			expect(lineTypes(store)).toEqual([ I.RecoveryLineType.Phase, I.RecoveryLineType.LocalPeers ]);

			store.applySnapshot(snapshot({ runId: 'run-2', lastEventId: 9, phase: I.RecoveryPhase.FetchingAccount, localPeers: I.RecoveryLocalPeersState.AccountFound }));

			expect(lineTypes(store)).toEqual([ I.RecoveryLineType.LocalPeers, I.RecoveryLineType.Phase ]);
			expect(store.lines[1].phase).toBe(I.RecoveryPhase.FetchingAccount);

			store.applySnapshot(snapshot({ runId: 'run-3', lastEventId: 2, phase: I.RecoveryPhase.Connecting, localPeers: I.RecoveryLocalPeersState.NoLocalPeers }));

			expect(lineTypes(store)).toEqual([ I.RecoveryLineType.Phase ]);
		});

	});

	describe('gating', () => {

		it('ignores duplicate ids', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));
			store.apply(phase(2, I.RecoveryPhase.Connecting));
			store.apply(phase(2, I.RecoveryPhase.Connecting));

			expect(store.lines.length).toBe(2);
			expect(rpc).not.toHaveBeenCalled();
		});

		it('resets on a new runId', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }));
			store.apply(phase(2, I.RecoveryPhase.Connecting));
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }, 'run-2'));

			expect(store.runId).toBe('run-2');
			expect(store.mode).toBe(I.RecoveryMode.Warm);
			expect(store.lastId).toBe(1);
			expect(lineTypes(store)).toEqual([ I.RecoveryLineType.Phase ]);
		});

		it('re-pulls on a gap, buffers meanwhile and drains after the snapshot', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));
			store.apply(phase(3, I.RecoveryPhase.FetchingAccount));

			expect(rpc).toHaveBeenCalledTimes(1);
			expect(store.lastId).toBe(1);

			// Arrives while the RPC is in flight
			store.apply(phase(4, I.RecoveryPhase.LoadingSpaces));

			expect(store.lastId).toBe(1);
			expect(store.lines.length).toBe(1);

			const callBack = rpc.mock.calls[0][0];

			callBack({ error: { code: 0 }, snapshot: snapshot({ lastEventId: 3, phase: I.RecoveryPhase.FetchingAccount, accountFetchAttempt: 2 }) });

			expect(store.lastId).toBe(4);
			expect(store.phase).toBe(I.RecoveryPhase.LoadingSpaces);
			expect(linePhases(store)).toEqual([ I.RecoveryPhase.FetchingAccount, I.RecoveryPhase.LoadingSpaces ]);
			expect(store.lines[0].attempt).toBe(2);
		});

		it('resets on ACCOUNT_IS_NOT_RUNNING and still drains the buffer', () => {
			// The attach-time pull before AccountSelect: Started lands while it is in flight
			store.pull();
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));

			expect(store.lines.length).toBe(0);

			rpc.mock.calls[0][0]({ error: { code: NOT_RUNNING, description: '' } });

			expect(store.runId).toBe(RUN);
			expect(store.lastId).toBe(1);
			expect(store.lines.length).toBe(1);
		});

		it('treats the idle snapshot (empty runId) as no run', () => {
			store.pull();
			rpc.mock.calls[0][0]({ error: { code: 0 }, snapshot: snapshot({ runId: '', phase: I.RecoveryPhase.NotStarted }) });

			expect(store.runId).toBe('');
			expect(store.isActive).toBe(false);
			expect(store.lines).toHaveLength(0);

			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));

			expect(store.runId).toBe(RUN);
			expect(store.lines).toHaveLength(1);
		});

		it('never renders NotStarted as a phase', () => {
			store.applySnapshot(snapshot({ runId: 'stale', lastEventId: 0, phase: I.RecoveryPhase.NotStarted }));

			expect(store.lines).toHaveLength(0);

			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));
			store.apply(phase(2, I.RecoveryPhase.NotStarted));

			expect(store.phase).toBe(I.RecoveryPhase.NotStarted);
			expect(lineTypes(store)).toEqual([ I.RecoveryLineType.Phase ]);
			expect(store.lines[0].phase).toBe(I.RecoveryPhase.LookingForPeers);
		});

		it('accepts gaps after an unexpected pull failure instead of looping', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));
			store.apply(phase(5, I.RecoveryPhase.Connecting));

			rpc.mock.calls[0][0]({ error: { code: 1, description: 'unimplemented' } });

			expect(store.lastId).toBe(1);

			store.apply(phase(7, I.RecoveryPhase.FetchingAccount));

			expect(rpc).toHaveBeenCalledTimes(1);
			expect(store.lastId).toBe(7);
			expect(store.phase).toBe(I.RecoveryPhase.FetchingAccount);
		});

		it('accepts a gap without a pull once the run is over', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));
			store.apply(update(2, I.RecoveryUpdateType.Finished, { spacesTotal: 2, spacesLoaded: 2, spacesFailed: 0, viewsConfirmed: true }));

			expect(store.isRecoveryNeeded()).toBe(false);

			// The run is frozen, so a snapshot could not tell us anything new
			store.apply(update(9, I.RecoveryUpdateType.PeerDisconnected, { peerId: 'p1', openConnections: 0 }));

			expect(rpc).not.toHaveBeenCalled();
			expect(store.lastId).toBe(9);
		});

		it('reports recovery as needed only while the run is live', () => {
			expect(store.isRecoveryNeeded()).toBe(true);

			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }));
			store.apply(update(2, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 's1' }));
			store.apply(update(3, I.RecoveryUpdateType.SpaceStateChanged, { spaceId: 's1', state: I.RecoverySpaceState.Loaded }));

			// Every known channel is loaded, but the run has not said so: a gap could still hide
			// channels we never heard about
			expect(store.isRecoveryNeeded()).toBe(true);

			store.apply(phase(4, I.RecoveryPhase.Failed, { error: { class: I.RecoveryErrorClass.AccountDeleted, retryable: false, debugMessage: '' } }));

			expect(store.isRecoveryNeeded()).toBe(false);
		});

		it('pulls on a gap rather than trusting the channels it happens to know', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));
			store.apply(update(2, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 's1' }));
			store.apply(update(3, I.RecoveryUpdateType.SpaceStateChanged, { spaceId: 's1', state: I.RecoverySpaceState.Loaded }));

			// A dropped batch could carry channels this client never saw
			store.apply(update(12, I.RecoveryUpdateType.SpaceStateChanged, { spaceId: 's2', state: I.RecoverySpaceState.Loaded }));

			expect(rpc).toHaveBeenCalledTimes(1);
			expect(store.lastId).toBe(3);
		});

		it('drops a pull answer that crossed a reset, and lets the next run pull again', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }));
			store.apply(phase(5, I.RecoveryPhase.Connecting));

			expect(rpc).toHaveBeenCalledTimes(1);

			// Logout while the pull is in flight
			store.clear();
			rpc.mock.calls[0][0]({ error: { code: 0 }, snapshot: snapshot({ lastEventId: 5, phase: I.RecoveryPhase.Connecting }) });

			expect(store.runId).toBe('');
			expect(store.isActive).toBe(false);
			expect(store.lines).toHaveLength(0);

			// A failure must not disable re-pulls for every later run
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }, 'run-2'));
			store.apply(update(7, I.RecoveryUpdateType.PhaseChanged, { phase: I.RecoveryPhase.Connecting }, 'run-2'));

			expect(rpc).toHaveBeenCalledTimes(2);
		});

		it('ignores a late update from the previous run without pulling for it', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }));
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }, 'run-2'));

			expect(store.runId).toBe('run-2');

			// Run 1 is gone; its tail must not discard run 2, nor freeze it for a round trip
			store.apply(phase(2, I.RecoveryPhase.Connecting));

			expect(store.runId).toBe('run-2');
			expect(store.mode).toBe(I.RecoveryMode.Warm);
			expect(store.lastId).toBe(1);
			expect(rpc).not.toHaveBeenCalled();
		});

		it('pulls for an unknown run whose Started was lost, even after a terminal run', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));
			store.apply(phase(2, I.RecoveryPhase.Failed, { error: { class: I.RecoveryErrorClass.AccountDeleted, retryable: false, debugMessage: '' } }));

			expect(store.isRecoveryNeeded()).toBe(false);

			// A retry began and its Started never arrived: without the pull the client would sit
			// on the dead run forever
			store.apply(update(4, I.RecoveryUpdateType.PhaseChanged, { phase: I.RecoveryPhase.Connecting }, 'run-3'));

			expect(rpc).toHaveBeenCalledTimes(1);

			rpc.mock.calls[0][0]({ error: { code: 0 }, snapshot: snapshot({ runId: 'run-3', lastEventId: 4, phase: I.RecoveryPhase.Connecting }) });

			expect(store.runId).toBe('run-3');
			expect(store.isActive).toBe(true);
		});

		it('records a buffered update once, not twice', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));
			store.apply(phase(3, I.RecoveryPhase.Connecting));

			// Arrives while the pull is in flight, so it is buffered and later drained
			store.apply(phase(4, I.RecoveryPhase.LoadingSpaces));
			rpc.mock.calls[0][0]({ error: { code: 0 }, snapshot: snapshot({ lastEventId: 3, phase: I.RecoveryPhase.Connecting }) });

			const ids = store.getDebugInfo().events.map((it: I.RecoveryUpdate) => it.id);

			expect(store.lastId).toBe(4);
			expect(ids).toEqual([ 1, 3, 4 ]);
		});

		it('does not pull twice concurrently', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));
			store.apply(phase(3, I.RecoveryPhase.Connecting));
			store.apply(phase(5, I.RecoveryPhase.FetchingAccount));

			expect(rpc).toHaveBeenCalledTimes(1);
		});

	});

	describe('snapshots', () => {

		it('applies a snapshot-on-attach update and rebuilds one headline', () => {
			store.apply(update(12, I.RecoveryUpdateType.Snapshot, snapshot({
				runId: 'run-9',
				lastEventId: 12,
				mode: I.RecoveryMode.Cold,
				phase: I.RecoveryPhase.LoadingSpaces,
				spaces: [
					{ spaceId: 'tech', spaceViewId: '', kind: I.RecoverySpaceKind.Tech, state: I.RecoverySpaceState.Loaded, error: null, attempt: 0 },
					{ spaceId: 's1', spaceViewId: 'v1', kind: I.RecoverySpaceKind.Regular, state: I.RecoverySpaceState.Loaded, error: null, attempt: 0 },
					{ spaceId: 's2', spaceViewId: 'v2', kind: I.RecoverySpaceKind.Regular, state: I.RecoverySpaceState.Pulling, error: null, attempt: 1 },
					{ spaceId: 's3', spaceViewId: 'v3', kind: I.RecoverySpaceKind.Regular, state: I.RecoverySpaceState.Removed, error: null, attempt: 0 },
				],
			}), 'run-9'));

			expect(store.runId).toBe('run-9');
			expect(store.lastId).toBe(12);
			expect(store.spaces.size).toBe(3);
			expect(store.lines.length).toBe(1);
			expect(store.lines[0]).toMatchObject({ phase: I.RecoveryPhase.LoadingSpaces, loaded: 1, total: 2 });

			store.apply(phase(13, I.RecoveryPhase.Done, {}, 'run-9'));

			expect(store.done).toBe(true);
			expect(store.lines.length).toBe(2);
		});

		it('rebuilds a finished snapshot as a single finished line', () => {
			store.applySnapshot(snapshot({ lastEventId: 20, phase: I.RecoveryPhase.Done, done: true, viewsConfirmed: false }));

			expect(store.isActive).toBe(false);
			expect(store.lines).toHaveLength(1);
			expect(store.lines[0]).toMatchObject({ type: I.RecoveryLineType.Finished, viewsConfirmed: false });
		});

		it('rebuilds the waiting overlay with its error class', () => {
			store.applySnapshot(snapshot({
				lastEventId: 4,
				phase: I.RecoveryPhase.WaitingForNetwork,
				error: { class: I.RecoveryErrorClass.PeerUnreachable, retryable: true, debugMessage: '' },
			}));

			expect(store.lines[0]).toMatchObject({ phase: I.RecoveryPhase.WaitingForNetwork, errorClass: I.RecoveryErrorClass.PeerUnreachable });
		});

		it('ignores a snapshot older than the applied stream', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Warm }));
			store.apply(phase(2, I.RecoveryPhase.Connecting));
			store.apply(phase(3, I.RecoveryPhase.FetchingAccount));

			store.applySnapshot(snapshot({ lastEventId: 1, phase: I.RecoveryPhase.LookingForPeers }));

			expect(store.lastId).toBe(3);
			expect(store.phase).toBe(I.RecoveryPhase.FetchingAccount);
			expect(store.lines.length).toBe(3);
		});

	});

	describe('debug info', () => {

		it('keeps every received update and the last snapshot for the dump', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }));
			store.apply(phase(2, I.RecoveryPhase.Connecting));
			store.apply(phase(2, I.RecoveryPhase.Connecting));
			store.applySnapshot(snapshot({ lastEventId: 5, phase: I.RecoveryPhase.FetchingAccount }));

			const info = store.getDebugInfo();

			expect(info.events).toHaveLength(3);
			expect(info.lastSnapshot.lastEventId).toBe(5);
			expect(info.state).toMatchObject({ runId: RUN, lastId: 5, phase: I.RecoveryPhase.FetchingAccount, mode: I.RecoveryMode.Warm });
			expect(Array.isArray(info.state.peers)).toBe(true);
			expect(() => JSON.stringify(info)).not.toThrow();

			// A new run keeps the previous one's tail as context; only a logout wipes it
			store.reset('run-2');

			expect(store.getDebugInfo().events).toHaveLength(3);

			store.clear();

			expect(store.getDebugInfo().events).toHaveLength(0);
			expect(store.getDebugInfo().lastSnapshot).toBeNull();
		});

	});

	describe('reset', () => {

		it('clears everything', () => {
			store.apply(update(1, I.RecoveryUpdateType.Started, { mode: I.RecoveryMode.Cold }));
			store.apply(update(2, I.RecoveryUpdateType.SpaceDiscovered, { spaceId: 's1' }));
			store.apply(update(3, I.RecoveryUpdateType.DialStarted, { peerId: 'p1' }));
			store.reset();

			expect(store.runId).toBe('');
			expect(store.lastId).toBe(0);
			expect(store.lines).toHaveLength(0);
			expect(store.spaces.size).toBe(0);
			expect(store.peers.size).toBe(0);
			expect(store.isActive).toBe(false);
		});

	});

});
