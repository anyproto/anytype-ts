(() => {

	let ports = [];
	let isInitMenu = false;

	const native = chrome.runtime.connectNative('com.anytype.desktop');

	native.postMessage({ type: 'getPorts' });

	native.onMessage.addListener((msg) => {
		console.log('[Native]', msg);

		if (msg.error) {
			console.error(msg.error);
		};

		switch (msg.type) {
			case 'launchApp': {
				break;
			};

			case 'getPorts': {
				if (msg.response) {
					for (let pid in msg.response) {
						ports = msg.response[pid];
						break;
					};
				};
				break;
			};
		};

	});

	native.onDisconnect.addListener(() => {
		console.log('[Native] Disconnected');
	});

	chrome.runtime.onInstalled.addListener((details) => {
		if (![ 'install', 'update' ].includes(details.reason)) {
			return;
		};

		if (details.reason == 'update') {
			const { version } = chrome.runtime.getManifest();

			console.log('Updated', details.previousVersion, version);
		};

		chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
			getActiveTab(tab => {
				if (tab && (tabId == tab.id) && (undefined !== changeInfo.url)) {
					sendToTab(tab, { type: 'hide' });
				};
			});
		});
	});

	chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
		let res = {};

		console.log('[Background]', msg);

		switch (msg.type) {
			case 'getPorts': {
				res = { ports };
				break;
			};

			case 'init': {
				initMenu();
				sendToActiveTab(msg);
				break;
			};

		};

		sendResponse(res);
		return true;
	});

	initMenu = () => {
		if (isInitMenu) {
			return;
		};

		chrome.contextMenus.create({
			id: 'webclipper',
			title: 'Anytype Web Clipper',
			contexts: [ 'selection' ]
		});

		chrome.contextMenus.onClicked.addListener(() => sendToActiveTab({ type: 'clickMenu' }));

		isInitMenu = true;
	};

	getActiveTab = (callBack) => {
		chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => callBack(tabs.length ? tabs[0] : null));
	};

	sendToActiveTab = (msg) => {
		getActiveTab((tab) => sendToTab(tab, msg));
	};

	sendToTab = (tab, msg) => {
		if (!tab) {
			return;
		};

		chrome.tabs.sendMessage(tab.id, msg, (response) => {
			console.log('[sendToTab]', response);
			return true;
		});
	};

})();