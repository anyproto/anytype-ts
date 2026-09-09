(() => {

	const allowedOrigins = [ new URL(chrome.runtime.getURL('/')).origin ];
	const containerId = [ 'anytypeWebclipper', 'container' ].join('-');
	const iframeId = [ 'anytypeWebclipper', 'iframe' ].join('-');
	let container = null;
	let iframe = null;
	let iframeReady = false;
	let pendingMenu = null;

	const hide = () => {
		if (container) {
			container.style.display = 'none';
		};
	};

	const forwardMenu = () => {
		if (!iframe || !iframeReady || !pendingMenu || !iframe.contentWindow) {
			return;
		};

		iframe.contentWindow.postMessage(pendingMenu, allowedOrigins[0]);
		pendingMenu = null;
	};

	const ensureClipper = () => {
		if (container && iframe) {
			return true;
		};

		const body = document.querySelector('body');
		if (!body) {
			return false;
		};

		container = document.getElementById(containerId);
		iframe = document.getElementById(iframeId);
		if (container && iframe) {
			return true;
		};

		container = document.createElement('div');
		const dimmer = document.createElement('div');
		iframe = document.createElement('iframe');

		container.id = containerId;
		iframe.id = iframeId;
		iframe.src = chrome.runtime.getURL('iframe/index.html');
		dimmer.className = 'dimmer';
		dimmer.addEventListener('click', hide);
		iframe.addEventListener('load', () => {
			iframeReady = true;
			forwardMenu();
		}, { once: true });

		container.appendChild(iframe);
		container.appendChild(dimmer);
		body.appendChild(container);
		return true;
	};

	chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
		if (sender.id !== chrome.runtime.id) {
			return false;
		};

		switch (msg.type) {
			case 'getSelectionHTML': {
				let html = '';
				const sel = window.getSelection();
				if (sel && sel.rangeCount) {
					const selectionContainer = document.createElement('div');
					for (let i = 0, len = sel.rangeCount; i < len; ++i) {
						selectionContainer.appendChild(sel.getRangeAt(i).cloneContents());
					};
					html = selectionContainer.innerHTML;
				};

				if (!html) {
					return false;
				};

				sendResponse(html);
				return true;
			};

			case 'clickMenu': {
				pendingMenu = { type: 'clickMenu', source: 'foreground', html: msg.html, url: msg.url };
				if (ensureClipper()) {
					container.style.display = 'block';
					forwardMenu();
				};
				break;
			};

			case 'hide': {
				hide();
				break;
			};
		};
		
		sendResponse({});
		return true;
	});

	window.addEventListener('message', e => {
		if (!allowedOrigins.includes(e.origin)) {
			return;
		};

		switch (e.data.type) {
			case 'clickClose':
				hide();
				break;
		};
	});

})();
