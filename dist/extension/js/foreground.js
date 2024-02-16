(() => {

	const extensionIds = [ 'jbnammhjiplhpjfncnlejjjejghimdkf', 'jkmhmgghdjjbafmkgjmplhemjjnkligf' ];
	const allowedOrigins = extensionIds.map(id => `chrome-extension://${id}`);
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
		if (!extensionIds.includes(sender.id)) {
			return false;
		};

		switch (msg.type) {
			case 'clickMenu':
				container.style.display = 'block';
				break;

			case 'hide':
				container.style.display = 'none';
				break;
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