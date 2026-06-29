/**
 * scrollTop that puts an element now at `contentTop` (its top relative to the
 * scroll content) back at the saved on-screen position `viewportDelta` (the
 * element-top minus the viewport-top at save time). Clamped to >= 0.
 */
const computeRestoreScrollTop = (contentTop: number, viewportDelta: number): number => {
	return Math.max(0, contentTop - viewportDelta);
};

interface SettleOptions {
	stableFrames?: number;
	maxFrames?: number;
};

/**
 * Decides when a post-restore re-pin loop should stop. Feed it the resulting
 * scrollTop after each re-pin via tick(); it returns true while the loop should
 * keep running, false once content is stable (N consecutive equal measurements),
 * the frame cap is reached, or the user has scrolled (disarm()).
 */
class ScrollSettleTracker {

	private stableFrames: number;
	private maxFrames: number;
	private last: number | null = null;
	private equalCount = 0;
	private frames = 0;
	private disarmed = false;

	constructor (options: SettleOptions = {}) {
		this.stableFrames = options.stableFrames ?? 2;
		this.maxFrames = options.maxFrames ?? 60;
	};

	tick (top: number): boolean {
		if (this.disarmed) {
			return false;
		};

		this.frames++;

		if ((this.last !== null) && (this.last === top)) {
			this.equalCount++;
		} else {
			this.equalCount = 0;
		};
		this.last = top;

		if ((this.equalCount >= this.stableFrames) || (this.frames >= this.maxFrames)) {
			return false;
		};
		return true;
	};

	disarm () {
		this.disarmed = true;
	};

	get active (): boolean {
		return !this.disarmed && (this.frames < this.maxFrames);
	};

};

export { computeRestoreScrollTop, ScrollSettleTracker };
