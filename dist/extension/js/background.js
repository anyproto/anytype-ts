(() => {

	let ports = [];
	let isInitMenu = false;

	const native = chrome.runtime.connectNative('com.anytype.desktop');

	native.postMessage({ type: 'getPorts' });

	native.onMessage.addListener((msg) => {
		if (msg.error) {
			console.error(msg.error);
		};

		switch (msg.type) {
			case 'launchApp': {
				sendToActiveTab({ type: 'launchApp', res: msg.response });
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
	});

	chrome.runtime.onInstalled.addListener(details => {
		if (![ 'install', 'update' ].includes(details.reason)) {
			return;
		};

		if (details.reason == 'update') {
			const { version } = chrome.runtime.getManifest();
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
		const res = {};

		switch (msg.type) {
			case 'launchApp': {
				native.postMessage({ type: 'launchApp' });
				break;
			};

			case 'getPorts': {
				native.postMessage({ type: 'getPorts' });
				break;
			};

			case 'checkPorts': {
				res.ports = ports;
				break;
			};

			case 'initMenu': {
				initMenu();
				break;
			};
		};

		sendResponse(res);
		return true;
	});

	initMenu = async () => {
		if (isInitMenu) {
			return;
		};

		isInitMenu = true;

		chrome.contextMenus.create({
			id: 'webclipper',
			title: 'Anytype Web Clipper',
			contexts: [ 'selection' ]
		});

		chrome.contextMenus.onClicked.addListener(async () => {
			const tab = await getActiveTab();

			chrome.scripting.executeScript({
				target: { tabId: tab.id },
				function: () => {
					const sel = window.getSelection();

					let html = '';
					if (sel.rangeCount) {
						const container = document.createElement('div');
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
		await sendToTab(await getActiveTab(), msg);
	};

	sendToTab = async (tab, msg) => {
		if (!tab) {
			return;
		};

		msg.url = tab.url;
		await chrome.tabs.sendMessage(tab.id, msg);
	};

})();