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

			if (msg.error) {
				callBack({ type: msg.type, error: msg.error });
				return;
			};

			switch (msg.type) {
				case 'NMHGetOpenPorts': {
					let port = '';
					for (let pid in msg.response) {
						port = msg.response[pid][1];
						break;
					};

					callBack({ type: msg.type, port });
					break;
				};
			};
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