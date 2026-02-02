// Extension chunk loader
// Loads manifest.js to get chunk list, then loads CSS and JS chunks
(function() {
	const jsBasePath = '../js/chunks/';
	const cssBasePath = '../css/chunks/';

	function loadScript(src) {
		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = src;
			script.onload = resolve;
			script.onerror = reject;
			document.body.appendChild(script);
		});
	}

	function loadStylesheet(href) {
		return new Promise((resolve, reject) => {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = href;
			link.onload = resolve;
			link.onerror = reject;
			document.head.appendChild(link);
		});
	}

	async function loadChunks() {
		// First load the manifest to get chunk list
		await loadScript(jsBasePath + 'manifest.js');

		// Load CSS files first
		const cssChunks = window.__EXTENSION_CSS__ || [];
		for (const css of cssChunks) {
			await loadStylesheet(cssBasePath + css);
		}

		// Then load JS chunks
		const jsChunks = window.__EXTENSION_CHUNKS__ || [];
		if (jsChunks.length === 0) {
			console.error('[Loader] No chunks found in manifest');
			return;
		}

		for (const chunk of jsChunks) {
			await loadScript(jsBasePath + chunk);
		}
	}

	loadChunks().catch(err => {
		console.error('[Loader] Failed to load extension:', err);
	});
})();
