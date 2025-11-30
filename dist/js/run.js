// Load chunks for optimized builds
// Strategy: Runtime first, then all vendors in parallel, then app

const vendorChunks = ['react', 'mobx', 'pdfjs', 'excalidraw', 'vendors'];
let vendorsLoaded = 0;
let vendorsFailed = 0;

function loadScript(src, onSuccess, onError) {
	const script = document.createElement('script');
	script.src = src + '?' + Math.random();
	script.type = 'text/javascript';
	script.onload = onSuccess;
	script.onerror = onError;
	document.body.appendChild(script);
}

function loadApp() {
	loadScript('./js/app.js', function() {
		// App loaded successfully
	}, function() {
		console.error('Failed to load app.js, reloading...');
		window.setTimeout(() => window.location.reload(), 1000);
	});
}

function loadVendors() {
	// Load all vendor chunks in parallel
	vendorChunks.forEach(function(chunkName) {
		loadScript('./js/' + chunkName + '.js', function() {
			vendorsLoaded++;
			// When all vendors are loaded, load the app
			if (vendorsLoaded === vendorChunks.length) {
				loadApp();
			}
		}, function() {
			console.error('Failed to load ' + chunkName + '.js');
			vendorsFailed++;
			// Continue even if a vendor fails - app might still work
			if (vendorsLoaded + vendorsFailed === vendorChunks.length) {
				loadApp();
			}
		});
	});
}

// Start by loading runtime, then vendors, then app
loadScript('./js/runtime.js', loadVendors, function() {
	console.error('Failed to load runtime.js, reloading...');
	window.setTimeout(() => window.location.reload(), 1000);
});