export type PowerEvent = 'suspend' | 'resume';

export interface PowerSnapshot {
	/** latest forwarded event, '' before the first one */
	state: PowerEvent | '';
	/** increases with every forwarded event, 0 before the first one */
	seq: number;
	/** highest seq a renderer reported as delivered to the middleware */
	delivered: number;
};

export const POWER_EVENTS: PowerEvent[] = [ 'suspend', 'resume' ];

/**
 * Debug-only drop hook for QA (Windows wake gate): drops the chosen power events and their replay.
 * - Packaged builds: only the explicit command line switch, e.g.
 *   `Anytype.exe --debug-drop-power-event=suspend` (values: suspend, resume, all; comma-separated).
 *   A switch is per launch and is never inherited from the environment; a deeplink is a single
 *   `anytype://` argument and can not carry it.
 * - Development builds: the switch or ANYTYPE_DEBUG_DROP_POWER_EVENT.
 */
export const DROP_ENV = 'ANYTYPE_DEBUG_DROP_POWER_EVENT';
export const DROP_SWITCH = '--debug-drop-power-event=';

/**
 * Parses the drop hook from the command line switch, or (development builds only) the environment.
 */
export const parseDropList = (env: Record<string, string | undefined>, argv: string[], isPackaged: boolean): Set<PowerEvent> => {
	// Arguments after a deeplink are not ours: a cold protocol launch must not carry the switch
	const list = argv || [];
	const link = list.findIndex(it => /^[a-z][a-z0-9+.-]*:\/\//i.test(String(it || '')));
	const own = (link >= 0) ? list.slice(0, link) : list;
	const arg = own.find(it => String(it || '').startsWith(DROP_SWITCH));
	const fromEnv = isPackaged ? '' : String(env?.[DROP_ENV] || '');
	const value = String((arg ? arg.substring(DROP_SWITCH.length) : '') || fromEnv || '');
	const ret = new Set<PowerEvent>();

	value.split(',').map(it => it.trim().toLowerCase()).forEach(it => {
		if (it == 'all') {
			POWER_EVENTS.forEach(e => ret.add(e));
		} else 
		if (POWER_EVENTS.includes(it as PowerEvent)) {
			ret.add(it as PowerEvent);
		};
	});

	return ret;
};

/**
 * Keeps the latest power state so a renderer can replay it after a reload or after account init.
 *
 * Every event is forwarded (no dedup: powerMonitor can miss a suspend, and a swallowed resume
 * would lose the Foreground report and the renderer reload). An event dropped by the debug hook is
 * neither forwarded nor recorded, so it is not replayed either: it behaves as a lost event.
 */
export class PowerStateTracker {

	private latest = { state: '' as PowerEvent | '', seq: 0 };
	private delivered = 0;
	private drop: Set<PowerEvent>;

	constructor (drop?: Set<PowerEvent>) {
		this.drop = drop || new Set();
	};

	setDropList (drop: Set<PowerEvent>) {
		this.drop = drop || new Set();
	};

	/**
	 * Records an event. Returns the snapshot to forward, or null when the debug hook dropped it.
	 */
	onEvent (event: PowerEvent): PowerSnapshot | null {
		if (this.drop.has(event)) {
			return null;
		};

		this.latest = { state: event, seq: this.latest.seq + 1 };
		return this.getSnapshot();
	};

	/**
	 * A renderer delivered seq to the middleware: other tabs need not replay it.
	 */
	ack (seq: number) {
		seq = Number(seq) || 0;

		if ((seq > this.delivered) && (seq <= this.latest.seq)) {
			this.delivered = seq;
		};
	};

	/**
	 * Logout: the next account starts fresh, nothing recorded so far is replayed into it.
	 */
	ackAll () {
		this.delivered = this.latest.seq;
	};

	getSnapshot (): PowerSnapshot {
		return { ...this.latest, delivered: this.delivered };
	};

	getDropList (): PowerEvent[] {
		return Array.from(this.drop);
	};

};

export const powerState = new PowerStateTracker();
