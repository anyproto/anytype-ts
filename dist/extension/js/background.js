(() => {

	let ports = [];

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
			getActiveTab((currentTab) => {
				if (!currentTab) {
					return;
				};

				if (currentTab && (tabId == currentTab.id) && (undefined !== changeInfo.url)) {
					sendToTab(currentTab, { type: 'hide' });
				};
			});
		});

		initMenu();
	});

	chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

		switch (msg.type) {
			case 'getPorts': {
				console.log('PORTS', ports);

				sendResponse({ ports });
				break;
			};
		};

		return true;
	});

	initMenu = () => {
		chrome.contextMenus.create({
			id: 'webclipper',
			title: 'Anytype Web Clipper',
			contexts: [ 'selection' ]
		});

		chrome.contextMenus.onClicked.addListener(() => {
			sendToActiveTab({ type: 'clickMenu' });
		});
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