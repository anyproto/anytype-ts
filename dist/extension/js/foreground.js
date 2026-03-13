(() => {

	const allowedOrigins = [ new URL(chrome.runtime.getURL('/')).origin ];
	const body = document.querySelector('body');
	const container = document.createElement('div');
	const dimmer = document.createElement('div');
	const iframe = document.createElement('iframe');

	if (body && !document.getElementById(iframe.id)) {
		body.appendChild(container);
	};

	container.id = [ 'anytypeWebclipper', 'container' ].join('-');
	container.appendChild(iframe);
	container.appendChild(dimmer);

	iframe.id = [ 'anytypeWebclipper', 'iframe' ].join('-');
	iframe.src = chrome.runtime.getURL('iframe/index.html');

	dimmer.className = 'dimmer';
	dimmer.addEventListener('click', () => {
		container.style.display = 'none';
	});

	chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
		if (sender.id !== chrome.runtime.id) {
			return false;
		};

		switch (msg.type) {
			case 'getSelectionHTML': {
				let html = '';
				const sel = window.getSelection();
				if (sel && sel.rangeCount) {
					const container = document.createElement('div');
					for (let i = 0, len = sel.rangeCount; i < len; ++i) {
						container.appendChild(sel.getRangeAt(i).cloneContents());
					};
					html = container.innerHTML;
				};

				// Avoid sending an empty html back to the background script
				if (!html) {
					return false;
				};

				sendResponse(html);
				return true;
			};

			case 'clickMenu': {
				container.style.display = 'block';
				break;
			};

			case 'hide': {
				container.style.display = 'none';
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

		const { data } = e;
		switch (data.type) {
			case 'clickClose':
				container.style.display = 'none';
				break;
		};
	});

})();
