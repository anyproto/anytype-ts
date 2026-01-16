/**
 * Web entry point for running Anytype in a browser.
 * This initializes the Electron mock before loading the main app.
 *
 * IMPORTANT: We use dynamic imports to ensure the Electron mock is set up
 * BEFORE any other code (like app.tsx) tries to access window.Electron.
 * Static imports are hoisted and execute before any other code.
 */

import React from 'react';

// First, set up the Electron mock BEFORE any imports that might use it
import { electronMock } from './lib/web/electronMock';

// Set up global configuration from URL params or defaults
const urlParams = new URLSearchParams(window.location.search);
const serverAddress = urlParams.get('server') ||
                      localStorage.getItem('anytype_serverAddress') ||
                      'http://127.0.0.1:31008';
const dataPath = urlParams.get('dataPath') ||
                 localStorage.getItem('anytype_dataPath') ||
                 '';

// Store settings for future use
localStorage.setItem('anytype_serverAddress', serverAddress);
if (dataPath) {
	localStorage.setItem('anytype_dataPath', dataPath);
}

// Configure the global config object
(window as any).AnytypeGlobalConfig = {
	serverAddress,
	dataPath,
};

// Set up the Electron mock BEFORE importing app
(window as any).Electron = electronMock;

// Mark this as web version
(window as any).isWebVersion = true;

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
	Notification.requestPermission();
}

console.log('[Anytype Web] Started with server:', serverAddress);
console.log('[Anytype Web] Data path:', dataPath || '(default - will be set by backend)');
console.log('[Anytype Web] To configure, add URL params: ?server=http://HOST:PORT&dataPath=/path/to/data');

// Use dynamic imports to ensure window.Electron is set up first
async function bootstrap() {
	const { createRoot } = await import('react-dom/client');
	const { default: App } = await import('./app');

	const container = document.getElementById('root');
	if (container) {
		const root = createRoot(container);
		root.render(<App />);
	}
}

bootstrap().catch(console.error);
