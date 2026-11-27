import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('amplitude-js', () => ({ default: { getInstance: () => ({}) } }));

import { analytics, AI_CONNECT_EVENTS } from './analytics';
import { track } from './aiConnect/events';

/** What a careless caller might add: every one of these must stay out of an AiConnect* payload */
const EXTRA = {
	spaceId: 'space-1', spaceType: 0, permissions: 'Owner', context: 'ctx', objectType: 'ot-page', name: 'Work notes',
	path: '/Users/me/.cursor/mcp.json', key: 'sk-anytype-SENTINEL', type: 'x', id: 'obj-1', count: 3, middleTime: 5,
};

describe('AiConnect* analytics: the payload is the allow-list (R2-26)', () => {
	let logEvent: ReturnType<typeof vi.fn>;
	let log: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		logEvent = vi.fn();
		analytics.instance = { logEvent };
		vi.stubGlobal('analytics', analytics);
		vi.stubGlobal('S', { Common: { config: { debug: { analytics: true }, sudo: false } } });
		vi.stubGlobal('U', {
			Common: { getElectron: () => ({ isPackaged: true }) },
			// An active space and participant: other events get spaceId, spaceType and permissions from these
			Space: {
				getSpaceview: () => ({ spaceAccessType: 1, analyticsSpaceId: 'analytics-space-1', spaceType: 0 }),
				getMyParticipant: () => ({ permissions: 1 }),
			},
		});
		log = vi.spyOn(analytics, 'log').mockImplementation(() => {});
		// A populated analytics context (an object is open)
		analytics.setContext('object-context-1');
		log.mockClear();
	});

	afterEach(() => {
		analytics.removeContext();
		analytics.instance = null;
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('the setup enriches ordinary events (so the AiConnect branch is what keeps them clean)', () => {
		analytics.event('ClickExport', { route: 'Settings' });

		expect(logEvent).toHaveBeenCalledWith('ClickExport', expect.objectContaining({
			spaceId: 'analytics-space-1', spaceType: expect.any(String), permissions: 'Writer', context: 'object-context-1', route: 'Settings',
		}));
	});

	it('each event passes exactly its allow-listed object, once, also to the debug log', () => {
		const sent: [ string, any ][] = [
			[ 'AiConnectOpen', { route: 'Deeplink' } ],
			[ 'AiConnectStart', { app: 'cursor', route: 'http' } ],
			[ 'AiConnectDelivered', { app: 'cursor', method: 'config' } ],
			[ 'AiConnectNextStep', { app: 'cursor', step: 'restart' } ],
			[ 'AiConnectProbeOk', { app: 'cursor' } ],
			[ 'AiConnectFailed', { app: 'claude-code', stage: 'cli', category: 'cliFailed' } ],
			[ 'AiConnectRemoved', { app: 'other', by: 'user' } ],
			[ 'AiConnectRemoved', { app: 'cursor', by: 'selfheal' } ],
			[ 'AiConnectUnsupportedShown', { app: 'chatgpt-web' } ],
		];

		track.open('Deeplink');
		track.start('cursor', 'http');
		track.delivered('cursor', 'config');
		track.nextStep('cursor', 'restart');
		track.probeOk('cursor');
		track.failed('claude-code', { stage: 'cli', category: 'cliFailed', path: '/Users/me/.claude.json' });
		track.removed('other', 'user');
		track.removed('cursor', 'selfheal');
		track.unsupportedShown('chatgpt-web');

		expect(logEvent.mock.calls).toEqual(sent);
		expect(log.mock.calls).toEqual(sent.map(([ code, param ]) => [ `[Analytics].event: ${code}`, param ]));
	});

	it('extra fields given to analytics.event never reach the payload', () => {
		const valid: Record<string, string> = { app: 'cursor', method: 'cli', step: 'restart', stage: 'write', category: 'permission', by: 'user' };

		for (const code of Object.keys(AI_CONNECT_EVENTS)) {
			const data = { ...EXTRA, ...valid, route: (code == 'AiConnectOpen') ? 'Deeplink' : 'http' };
			const expected = Object.fromEntries(Object.keys(AI_CONNECT_EVENTS[code]).map(k => [ k, data[k] ]));

			logEvent.mockClear();
			analytics.event(code, data);
			expect(logEvent.mock.calls).toEqual([ [ code, expected ] ]);
		};
	});

	/** What the `analyticsEvent` payload broadcast (app.tsx onPayloadBroadcast) does with a decoded payload */
	const broadcast = (payload: any) => analytics.event(payload.code, payload.param);

	it('Z10: a name, path or key-shaped value in any field drops the whole event, before transport and debug log', () => {
		const bad = [ 'Finance', 'PrivateProject', 'sk-anytype-SENTINEL', 'ExampleToken0123456789', '/Users/me/app', 'cursor ', '' ];
		const valid: Record<string, Record<string, string>> = {
			AiConnectOpen: { route: 'Deeplink' },
			AiConnectStart: { app: 'cursor', route: 'http' },
			AiConnectDelivered: { app: 'cursor', method: 'config' },
			AiConnectNextStep: { app: 'cursor', step: 'restart' },
			AiConnectProbeOk: { app: 'cursor' },
			AiConnectFailed: { app: 'cursor', stage: 'write', category: 'permission' },
			AiConnectRemoved: { app: 'cursor', by: 'user' },
			AiConnectUnsupportedShown: { app: 'chatgpt-web' },
		};

		for (const code of Object.keys(valid)) {
			for (const field of Object.keys(valid[code])) {
				for (const value of bad) {
					broadcast({ code, param: { ...valid[code], [field]: value } });
				};
				broadcast({ code, param: { ...valid[code], [field]: { nested: true } } });
			};
		};
		expect(logEvent).not.toHaveBeenCalled();
		expect(log).not.toHaveBeenCalled();
	});

	it('Z10: a missing field drops the event; Open and Start routes are separate domains', () => {
		broadcast({ code: 'AiConnectFailed', param: { app: 'cursor' } });
		broadcast({ code: 'AiConnectStart', param: { app: 'cursor' } });
		broadcast({ code: 'AiConnectOpen', param: { route: 'http' } });
		broadcast({ code: 'AiConnectStart', param: { app: 'cursor', route: 'Deeplink' } });
		broadcast({ code: 'AiConnectRemoved', param: { app: 'cursor', by: 'admin' } });
		expect(logEvent).not.toHaveBeenCalled();

		broadcast({ code: 'AiConnectOpen', param: { route: 'ScreenSettingsApi' } });
		broadcast({ code: 'AiConnectStart', param: { app: 'other', route: 'skill' } });
		expect(logEvent.mock.calls).toEqual([
			[ 'AiConnectOpen', { route: 'ScreenSettingsApi' } ],
			[ 'AiConnectStart', { app: 'other', route: 'skill' } ],
		]);
	});

	it('AiConnectConnected (and any other AiConnect* code without an allow-list) is not sent', () => {
		analytics.event('AiConnectConnected', { app: 'cursor', secondsToFirstUse: 4 });
		analytics.event('AiConnectWhatever', { app: 'cursor' });

		expect(logEvent).not.toHaveBeenCalled();
	});

	it('nothing is sent while analytics is off', () => {
		vi.stubGlobal('S', { Common: { config: { debug: { analytics: false }, sudo: false } } });
		vi.stubGlobal('U', { Common: { getElectron: () => ({ isPackaged: false }) }, Space: { getSpaceview: () => null, getMyParticipant: () => null } });

		track.open('Settings');
		expect(logEvent).not.toHaveBeenCalled();
	});
});
