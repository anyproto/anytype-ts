/**
 * Lightweight startup/runtime performance instrumentation.
 *
 * Thin wrapper around the User Timing API (performance.mark / performance.measure).
 * Marks and measures recorded here show up:
 *   - in the DevTools Performance panel (Timings track),
 *   - in Electron contentTracing output (blink.user_timing category) — see ANYTYPE_TRACE_STARTUP,
 * so the app's own boot milestones line up against the native flame chart and network waterfall.
 *
 * All names are namespaced with PREFIX so they're trivial to filter in the timeline.
 */

const PREFIX = 'at:';

class UtilPerf {

	/**
	 * Records a single point-in-time mark.
	 */
	mark (name: string): void {
		try {
			performance.mark(`${PREFIX}${name}`);
		} catch (e) { /* User Timing unavailable */ };
	};

	/**
	 * Creates a measure spanning from a previously recorded mark to now (or to endMark),
	 * logs it, and returns the duration in milliseconds (0 if it could not be computed).
	 */
	measure (name: string, startMark?: string, endMark?: string): number {
		let ms = 0;

		try {
			const start = startMark ? `${PREFIX}${startMark}` : undefined;
			const end = endMark ? `${PREFIX}${endMark}` : undefined;
			const entry = performance.measure(`${PREFIX}${name}`, start, end);

			ms = Math.round(entry?.duration || 0);
		} catch (e) {
			// startMark may be missing (e.g. after an HMR full reload) — skip silently
			return 0;
		};

		console.log(`[Perf] ${name}: ${ms}ms`);
		return ms;
	};

	/**
	 * Convenience: mark `name` and, when `from` is given, measure `from`→`name` in one call.
	 */
	step (name: string, from?: string): void {
		this.mark(name);

		if (from) {
			this.measure(`${from}->${name}`, from, name);
		};
	};

};

export default new UtilPerf();
