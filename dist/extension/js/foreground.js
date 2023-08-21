(() => {

	const extensionId = 'jkmhmgghdjjbafmkgjmplhemjjnkligf';
	const body = document.querySelector('body');
	const iframe = document.createElement('iframe');

	if (body && !document.getElementById(iframe.id)) {
		body.appendChild(iframe);
	};

	iframe.id = 'anytypeWebclipper-iframe';
	iframe.src = chrome.runtime.getURL('iframe/index.html');

	chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
		console.log('Foreground message', msg, sender);

		if (sender.id != extensionId) {
			return;
		};

		switch (msg.type) {
			case 'clickMenu':
				iframe.style.display = 'block';
				break;
		};

		return true;
	});

	window.addEventListener('message', (e) => {
		if (e.origin != `chrome-extension://${extensionId}`) {
			return;
		};

		const { data } = e;

		console.log('postMessage', data);

		switch (data.type) {
			case 'clickClose':
				iframe.style.display = 'none';
				break;
		};
	});

})();