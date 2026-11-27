/**
 * The `window.Electron` stand-in of the web clipper extension. Side-effect free, so tests can check
 * it lacks the desktop-only capabilities (e.g. `aiConnect`).
 */
export const extensionBridge = {
	currentWindow: () => ({}),
	Api: () => {},
	platform: '',
	tabId: (): string | null => null,
	winId: () => 0,
	on: () => {},
	removeAllListeners: () => {},
	send: () => {},
	getTheme: () => '',
};
