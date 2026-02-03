/**
 * PixiJS entry point for web worker bundling.
 * Exports the required PixiJS components for graph rendering.
 */

import {
	Application,
	Container,
	Graphics,
	Sprite,
	Texture,
	RenderTexture,
	Text,
	TextStyle,
	Circle,
	Rectangle,
	DOMAdapter,
	WebWorkerAdapter,
	autoDetectRenderer,
	extensions,
} from 'pixi.js';

// Set up the WebWorkerAdapter for OffscreenCanvas support
DOMAdapter.set(WebWorkerAdapter);

// Export to global scope for importScripts usage
declare const self: typeof globalThis & {
	PIXI: typeof PIXI;
};

const PIXI = {
	Application,
	Container,
	Graphics,
	Sprite,
	Texture,
	RenderTexture,
	Text,
	TextStyle,
	Circle,
	Rectangle,
	DOMAdapter,
	WebWorkerAdapter,
	autoDetectRenderer,
	extensions,
};

self.PIXI = PIXI;
