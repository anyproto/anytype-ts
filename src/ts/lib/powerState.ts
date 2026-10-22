import * as I from 'Interface';

export type PowerEventName = 'suspend' | 'resume';

/** Latest power state as tracked by the main process; seq orders events, 0 = none yet */
export interface PowerSnapshot {
	state: PowerEventName | '';
	seq: number;
	/** main process only: highest seq any renderer delivered */
	delivered?: number;
};

export const POWER_RETRY_BASE = 1000;
export const POWER_RETRY_ATTEMPTS = 5;

/**
 * Delivers the OS power state to the middleware as AppSetDeviceState.
 *
 * The main process forwards powerMonitor suspend/resume with a sequence number and keeps the latest
 * state. The middleware ignores AppSetDeviceState before the account is running, and a renderer
 * reload can drop a call in flight, so the latest state is replayed after account init (which
 * also runs after every renderer reload). Failed calls are retried unless a newer event arrived.
 */
export class PowerStateReporter {

	private latest: PowerSnapshot = { state: '', seq: 0 };
	private delivered = 0;
	private isReady = false;
	private retryTimer = 0;

	/**
	 * A power event from the main process (live), or the latest state it kept (replay).
	 */
	onEvent (state: string, seq: number, source: string) {
		if (![ 'suspend', 'resume' ].includes(state)) {
			return;
		};

		seq = Number(seq) || 0;

		// seq 0: an older main process without sequence numbers, every event counts
		if (seq && (seq <= this.latest.seq)) {
			console.log('[PowerState] skip', source, state, 'seq:', seq, 'latest:', this.latest.seq);
			return;
		};

		this.latest = { state: state as PowerEventName, seq: seq || (this.latest.seq + 1) };
		console.log('[PowerState] received', source, state, 'seq:', this.latest.seq, 'ready:', this.isReady);

		this.deliver(0);
	};

	/**
	 * The account is running: replay the latest state the main process kept.
	 */
	onAccountReady () {
		this.isReady = true;
		this.deliver(0);

		const promise = Renderer.send('getPowerState');

		if (!promise || !promise.then) {
			return;
		};

		promise.then((snapshot: PowerSnapshot) => {
			// Replay only what no renderer delivered yet: after a resume every tab reloads, one report is enough
			if (snapshot?.state && (Number(snapshot.seq) > (Number(snapshot.delivered) || 0))) {
				this.onEvent(snapshot.state, snapshot.seq, 'replay');
			};
		}).catch((e: any) => console.error('[PowerState] getPowerState failed', e));
	};

	/**
	 * Logout: nothing received so far is replayed into the next account (its network state starts
	 * fresh; a stale resume would cost a recovery flush at account start).
	 */
	onLogout () {
		this.isReady = false;
		this.delivered = this.latest.seq;
		window.clearTimeout(this.retryTimer);
	};

	getLatest (): PowerSnapshot {
		return { ...this.latest };
	};

	private deliver (attempt: number, force?: boolean) {
		window.clearTimeout(this.retryTimer);

		const { state, seq } = this.latest;

		if (!this.isReady || !state || (!force && (seq <= this.delivered))) {
			return;
		};

		const deviceState = state == 'suspend' ? I.AppDeviceState.Background : I.AppDeviceState.Foreground;

		// Claimed on send: a resume reloads every tab 1.5s later, often before the answer arrives,
		// and the reloaded tabs must not all replay it. This tab keeps retrying while it lives.
		Renderer.send('powerStateDelivered', seq);

		C.AppSetDeviceState(deviceState, (message: any) => {
			const code = Number(message?.error?.code) || 0;

			if (seq != this.latest.seq) {
				// An older state completed after a newer one: calls apply in completion order, so if the
				// newer one already landed, this stale one overwrote it. Assert the latest again.
				if (!code && this.isReady && (this.delivered >= this.latest.seq)) {
					console.warn('[PowerState] stale', state, 'seq:', seq, 'landed after seq:', this.latest.seq, ', re-asserting');
					this.deliver(0, true);
				};
				return;
			};

			if (!code) {
				this.delivered = Math.max(this.delivered, seq);
				console.log('[PowerState] delivered', state, 'seq:', seq, 'attempt:', attempt);
				return;
			};

			if (attempt + 1 >= POWER_RETRY_ATTEMPTS) {
				console.error('[PowerState] giving up', state, 'seq:', seq, 'code:', code);
				return;
			};

			const delay = POWER_RETRY_BASE * Math.pow(2, attempt);

			console.warn('[PowerState] failed', state, 'seq:', seq, 'code:', code, 'retry in', delay);
			this.retryTimer = window.setTimeout(() => this.deliver(attempt + 1), delay);
		});
	};

};

export const powerState = new PowerStateReporter();
