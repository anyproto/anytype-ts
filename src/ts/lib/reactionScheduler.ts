/**
 * Custom MobX reaction scheduler that pauses React observer re-renders
 * in inactive Electron tabs while keeping MobX stores updating normally.
 *
 * When paused, reaction callbacks are queued and flushed on resume.
 * This module has no dependencies on Lib/Store to avoid circular imports.
 */

let paused = false;
let queue: (() => void)[] = [];

const scheduleReaction = (f: () => void) => {
	if (paused) {
		queue.push(f);
	} else {
		f();
	};
};

const setReactionsPaused = (v: boolean) => {
	paused = v;

	if (!v && queue.length) {
		const pending = queue;
		queue = [];

		for (const f of pending) {
			f();
		};
	};
};

const clearReactionQueue = () => {
	queue = [];
};

export { scheduleReaction, setReactionsPaused, clearReactionQueue };
