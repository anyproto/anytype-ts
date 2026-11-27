/**
 * Connect to AI apps: the analytics events (Phase 4, R2-26). Every AiConnect* event is sent from here, with
 * identifiers only; `analytics.event` builds the final payload from each event's allow-list
 * (`AI_CONNECT_EVENTS`) and adds nothing else. `AiConnectConnected` is not sent in the POC.
 */
import type { AiAppId, AiError, AiMethod, AiNextStep, AiRoute } from '../../interface/aiConnect';

const send = (code: string, data: Record<string, string>): void => {
	analytics.event(code, data);
};

export const track = {
	/** The AI apps page opened; `route` = where from (analytics route) */
	open: (route: string) => send('AiConnectOpen', { route }),
	/** The user approved a delivery; `route` = the delivery route */
	start: (app: AiAppId, route: AiRoute) => send('AiConnectStart', { app, route }),
	delivered: (app: AiAppId, method: AiMethod) => send('AiConnectDelivered', { app, method }),
	/** A delivery that needs one more step in the AI app */
	nextStep: (app: AiAppId, step: AiNextStep) => send('AiConnectNextStep', { app, step }),
	probeOk: (app: AiAppId) => send('AiConnectProbeOk', { app }),
	failed: (app: AiAppId, error: AiError) => send('AiConnectFailed', { app, stage: error?.stage || 'validate', category: error?.category || 'unknown' }),
	/** `user`: Disconnect / Forget; `selfheal`: main's check found the app's entry gone (once per absence) */
	removed: (app: AiAppId, by: 'user' | 'selfheal') => send('AiConnectRemoved', { app, by }),
	unsupportedShown: (app: AiAppId) => send('AiConnectUnsupportedShown', { app }),
};
