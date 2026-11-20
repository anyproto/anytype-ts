import path from 'path';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const state = vi.hoisted(() => ({
	isPackaged: false,
	switches: new Set<string>(),
	paths: {} as Record<string, string>,
	name: 'anytype',
}));

vi.mock('electron', () => ({
	app: {
		get isPackaged () { return state.isPackaged; },
		commandLine: { hasSwitch: (name: string) => state.switches.has(name) },
		getPath: (name: string) => state.paths[name],
		setPath: vi.fn((name: string, value: string) => { state.paths[name] = value; }),
		setName: vi.fn((name: string) => { state.name = name; }),
	},
}));

import { app } from 'electron';
import { applyIsolatedDev, isIsolatedDev, isolatedDataPath, withAppName, DEV_NAME } from './isolateDev';

// Built with the host's path module, so the tests pass on Windows, macOS and Linux alike
const APP_DATA = path.join(path.sep, 'appData');
const SHARED = path.join(APP_DATA, 'anytype');
const ISOLATED = path.join(APP_DATA, 'anytype-dev');

beforeEach(() => {
	vi.clearAllMocks();
	state.isPackaged = false;
	state.switches = new Set();
	state.paths = { appData: APP_DATA, userData: SHARED };
	state.name = 'anytype';
});

describe('isIsolatedDev', () => {
	test('is on for a run from source with --isolate-dev', () => {
		state.switches.add('isolate-dev');
		expect(isIsolatedDev()).toBe(true);
	});

	test('is off without the flag', () => {
		expect(isIsolatedDev()).toBe(false);
	});

	test('is off in packaged builds, even with the flag', () => {
		state.isPackaged = true;
		state.switches.add('isolate-dev');
		expect(isIsolatedDev()).toBe(false);
	});
});

describe('isolatedDataPath', () => {
	test('sits next to the shared folder in appData', () => {
		expect(isolatedDataPath()).toBe(ISOLATED);
	});
});

describe('applyIsolatedDev', () => {
	test('renames the app and moves userData to the isolated folder', () => {
		state.switches.add('isolate-dev');
		applyIsolatedDev();

		expect(state.name).toBe(DEV_NAME);
		expect(state.paths.userData).toBe(ISOLATED);
	});

	test('keeps the folder given with --user-data-dir', () => {
		state.switches.add('isolate-dev');
		state.switches.add('user-data-dir');
		state.paths.userData = '/custom';
		applyIsolatedDev();

		expect(state.name).toBe(DEV_NAME);
		expect(app.setPath).not.toHaveBeenCalled();
		expect(state.paths.userData).toBe('/custom');
	});

	test('changes nothing without the flag', () => {
		applyIsolatedDev();

		expect(app.setName).not.toHaveBeenCalled();
		expect(app.setPath).not.toHaveBeenCalled();
		expect(state.paths.userData).toBe(SHARED);
	});

	test('changes nothing in packaged builds', () => {
		state.isPackaged = true;
		state.switches.add('isolate-dev');
		applyIsolatedDev();

		expect(app.setName).not.toHaveBeenCalled();
		expect(app.setPath).not.toHaveBeenCalled();
		expect(state.paths.userData).toBe(SHARED);
	});
});

describe('withAppName', () => {
	test('names the app Anytype Dev in isolated runs, in any language', () => {
		state.switches.add('isolate-dev');

		expect(withAppName('Quit Anytype')).toBe('Quit Anytype Dev');
		expect(withAppName('Anytype beenden')).toBe('Anytype Dev beenden');
		expect(withAppName('Check for Updates')).toBe('Check for Updates');
	});

	test('leaves the text alone otherwise', () => {
		expect(withAppName('Quit Anytype')).toBe('Quit Anytype');
	});
});
