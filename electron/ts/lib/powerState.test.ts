import { describe, it, expect } from 'vitest';
import { PowerStateTracker, parseDropList, DROP_ENV, DROP_SWITCH } from './powerState';

describe('PowerStateTracker', () => {

	it('starts with no state (not suspend)', () => {
		expect(new PowerStateTracker().getSnapshot()).toEqual({ state: '', seq: 0, delivered: 0 });
	});

	it('forwards every event, including repeated resumes, with increasing seq', () => {
		const tracker = new PowerStateTracker();

		expect(tracker.onEvent('suspend')).toEqual({ state: 'suspend', seq: 1, delivered: 0 });
		expect(tracker.onEvent('resume')).toEqual({ state: 'resume', seq: 2, delivered: 0 });
		expect(tracker.onEvent('resume')).toEqual({ state: 'resume', seq: 3, delivered: 0 });
	});

	it('tracks the delivered seq so other tabs do not replay it', () => {
		const tracker = new PowerStateTracker();

		tracker.onEvent('suspend');
		tracker.onEvent('resume');
		tracker.ack(2);
		tracker.ack(1);
		tracker.ack(9);

		expect(tracker.getSnapshot()).toEqual({ state: 'resume', seq: 2, delivered: 2 });
	});

	it('marks everything delivered on logout', () => {
		const tracker = new PowerStateTracker();

		tracker.onEvent('resume');
		tracker.ackAll();

		expect(tracker.getSnapshot().delivered).toBe(1);
	});

	it('drops a chosen event and keeps it out of the replay', () => {
		const tracker = new PowerStateTracker(new Set([ 'suspend' ]));

		expect(tracker.onEvent('resume')).toEqual({ state: 'resume', seq: 1, delivered: 0 });
		expect(tracker.onEvent('suspend')).toBeNull();
		expect(tracker.getSnapshot()).toEqual({ state: 'resume', seq: 1, delivered: 0 });
	});

	it('drops everything with all', () => {
		const tracker = new PowerStateTracker();

		tracker.setDropList(parseDropList({}, [ `${DROP_SWITCH}all` ], true));

		expect(tracker.onEvent('suspend')).toBeNull();
		expect(tracker.onEvent('resume')).toBeNull();
		expect(tracker.getSnapshot()).toEqual({ state: '', seq: 0, delivered: 0 });
	});
});

describe('parseDropList', () => {

	it('reads the switch in every build', () => {
		expect(Array.from(parseDropList({}, [ 'anytype', `${DROP_SWITCH}suspend,resume` ], true))).toEqual([ 'suspend', 'resume' ]);
		expect(Array.from(parseDropList({}, [ `${DROP_SWITCH}Resume` ], false))).toEqual([ 'resume' ]);
	});

	it('reads the environment only in development builds', () => {
		expect(Array.from(parseDropList({ [DROP_ENV]: 'resume' }, [], false))).toEqual([ 'resume' ]);
		expect(parseDropList({ [DROP_ENV]: 'resume' }, [], true).size).toBe(0);
	});

	it('is empty by default and ignores unknown values', () => {
		expect(parseDropList({}, [], false).size).toBe(0);
		expect(parseDropList({ [DROP_ENV]: 'lock-screen' }, [], false).size).toBe(0);
		expect(parseDropList({}, [ 'anytype://invite/?cid=--debug-drop-power-event=all' ], true).size).toBe(0);
	});

	it('ignores arguments after a deeplink', () => {
		expect(parseDropList({}, [ 'Anytype.exe', 'anytype://invite/?cid=x', `${DROP_SWITCH}all` ], true).size).toBe(0);
		expect(parseDropList({}, [ 'Anytype.exe', `${DROP_SWITCH}suspend`, 'anytype://invite/?cid=x' ], true).size).toBe(1);
	});
});
