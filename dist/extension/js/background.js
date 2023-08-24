(() => {

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
			case 'initNative': {
				initNative(sendResponse);
				break;
			};
		};

		return true;
	});

	const initNative = (callBack) => {
		const client = chrome.runtime.connectNative('com.anytype.desktop');

		client.onMessage.addListener((msg) => {
			console.log('[Native]', msg);

			const res = { ...msg };

			switch (msg.type) {
				case 'NMHStartApplication': {
					if (!msg.error) {
						client.postMessage({ type: 'NMHGetOpenPorts' });
					};
					break;
				};

				case 'NMHGetOpenPorts': {
					let port = '';

					if (msg.response) {
						for (let pid in msg.response) {
							port = msg.response[pid][1];
							break;
						};
					};

					if (!port || msg.error) {
						res.error = '';
						client.postMessage({ type: 'NMHStartApplication' });
					} else {
						res.port = port;
					};
					break;
				};
			};

			callBack(res);
		});

		client.onDisconnect.addListener(() => {
			console.log('[Native] Disconnected');
		});

		client.postMessage({ type: 'NMHGetOpenPorts' });
	};

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
		getActiveTab((tab) => {
			sendToTab(tab, msg);
		});
	};

	sendToTab = (tab, msg) => {
		if (!tab) {
			return;
		};

		chrome.tabs.sendMessage(tab.id, msg, (response) => {
			console.log('Res', response);
			return true;
		});
	};

})();