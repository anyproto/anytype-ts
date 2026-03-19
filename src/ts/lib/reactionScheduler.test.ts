import { describe, it, expect, beforeEach } from 'vitest';
import { scheduleReaction, setReactionsPaused, clearReactionQueue } from './reactionScheduler';

describe('reactionScheduler', () => {

	beforeEach(() => {
		setReactionsPaused(false);
		clearReactionQueue();
	});

	describe('scheduleReaction', () => {
		it('should execute reaction immediately when not paused', () => {
			let called = false;
			scheduleReaction(() => { called = true; });

			expect(called).toBe(true);
		});

		it('should queue reaction when paused', () => {
			let called = false;
			setReactionsPaused(true);
			scheduleReaction(() => { called = true; });

			expect(called).toBe(false);
		});
	});

	describe('setReactionsPaused', () => {
		it('should flush queued reactions on resume', () => {
			const calls: number[] = [];
			setReactionsPaused(true);

			scheduleReaction(() => calls.push(1));
			scheduleReaction(() => calls.push(2));
			scheduleReaction(() => calls.push(3));

			expect(calls).toEqual([]);

			setReactionsPaused(false);

			expect(calls).toEqual([1, 2, 3]);
		});

		it('should not flush when re-pausing', () => {
			const calls: number[] = [];
			setReactionsPaused(true);
			scheduleReaction(() => calls.push(1));

			setReactionsPaused(true);

			expect(calls).toEqual([]);
		});

		it('should handle resume with empty queue', () => {
			setReactionsPaused(true);
			setReactionsPaused(false);
			// Should not throw
		});

		it('should allow new reactions after resume', () => {
			setReactionsPaused(true);
			setReactionsPaused(false);

			let called = false;
			scheduleReaction(() => { called = true; });

			expect(called).toBe(true);
		});
	});

	describe('clearReactionQueue', () => {
		it('should discard queued reactions', () => {
			const calls: number[] = [];
			setReactionsPaused(true);

			scheduleReaction(() => calls.push(1));
			scheduleReaction(() => calls.push(2));

			clearReactionQueue();
			setReactionsPaused(false);

			expect(calls).toEqual([]);
		});
	});

});
