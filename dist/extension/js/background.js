(() => {

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
			console.log('Received', msg);

			if (msg.error) {
				console.error(msg.error);
				return;
			};

			switch (msg.type) {
				case 'NMHGetOpenPorts': {
					let port = '';
					for (let pid in msg.response) {
						port = msg.response[pid][1];
						break;
					};

					callBack({ type: 'NMHGetOpenPorts', port });
					break;
				};
			};
		});

		client.onDisconnect.addListener(() => {
			console.log('Disconnected');
		});

		client.postMessage({ type: 'NMHGetOpenPorts' });
	};

	chrome.contextMenus.create({
		id: 'webclipper',
		title: 'Anytype Web Clipper',
		contexts: [ 'selection' ]
	});

	chrome.contextMenus.onClicked.addListener((data) => {
		console.log('Click');
	});

})();