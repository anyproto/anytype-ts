// Load chunks in order for optimized builds
// Runtime must load first, then vendors, then app
// Rspack runtime will handle loading other async chunks as needed
const chunks = [
	'runtime',    // Rspack runtime - must load first
	'react',      // React libraries
	'mobx',       // MobX state management
	'pdfjs',      // PDF.js library
	'excalidraw', // Excalidraw drawing library (large)
	'vendors',    // Other vendor libraries
	'app'         // Main application entry point
];

let loadedCount = 0;
let failedCount = 0;

function loadChunk(index) {
	if (index >= chunks.length) {
		if (failedCount > 0 && loadedCount === 0) {
			console.error('Failed to load application chunks, reloading...');
			window.setTimeout(() => window.location.reload(), 1000);
		}
		return;
	}

	const chunkName = chunks[index];
	const script = document.createElement('script');

	script.src = `./js/${chunkName}.js?${Math.random()}`;
	script.type = 'text/javascript';

	script.onload = function() {
		loadedCount++;
		loadChunk(index + 1);
	};

	script.onerror = function() {
		console.error(`Failed to load ${chunkName}.js`);
		failedCount++;

		// If runtime fails, reload the page
		if (chunkName === 'runtime' || chunkName === 'app') {
			console.error('Critical chunk failed to load, reloading...');
			window.setTimeout(() => window.location.reload(), 1000);
			return;
		}

		// Try loading the next chunk
		loadChunk(index + 1);
	};

	document.body.appendChild(script);
}

// Start loading chunks sequentially
loadChunk(0);