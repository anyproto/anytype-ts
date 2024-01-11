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

	chrome.runtime.onInstalled.addListener(details => {
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

	chrome.tabs.onActivated.addListener(tab => {
		console.log('[onActivated]', tab);

		chrome.tabs.get(tab.tabId, info => {
			console.log('[Tab]', info);

			chrome.tabs.sendMessage(tab.tabId, { type: 'HELLO' });
		});
	});

	chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
		switch (msg.type) {
			case 'getPorts': {
				sendResponse({ ports });
				break;
			};

			case 'init': {
				initMenu();
				sendToActiveTab({ ports });
				break;
			};

		};
		return true;
	});

	initMenu = async () => {
		if (isInitMenu) {
			return;
		};

		const tab = await getActiveTab();

		isInitMenu = true;

		chrome.contextMenus.create({
			id: 'webclipper',
			title: 'Anytype Web Clipper',
			contexts: [ 'selection' ]
		});

		chrome.contextMenus.onClicked.addListener(() => {
			chrome.scripting.executeScript({
				target: { tabId: tab.id },
				function: () => {
					const sel = window.getSelection();

					let html = '';
					if (sel.rangeCount) {
						const container = document.createElement("div");
						for (var i = 0, len = sel.rangeCount; i < len; ++i) {
							container.appendChild(sel.getRangeAt(i).cloneContents());
						};
						html = container.innerHTML;
					};

					return html;
				}
			}, res => {
				if (res.length) {
					sendToTab(tab, { type: 'clickMenu', html: res[0].result });
				};
			});
		});
	};

	getActiveTab = async () => {
		const [ tab ] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
		return tab;
	};

	sendToActiveTab = async (msg) => {
		const tab = await getActiveTab();

		console.log('[sendToActiveTab]', tab, msg);

		await sendToTab(tab, msg);
	};

	sendToTab = async (tab, msg) => {
		if (!tab) {
			return;
		};

		const response = await chrome.tabs.sendMessage(tab.id, msg);

		console.log('[sendToTab]', tab, msg, response);
	};

})();