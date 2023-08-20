(() => {

	const extensionId = 'jkmhmgghdjjbafmkgjmplhemjjnkligf';
	const body = document.querySelector('body');
	const iframe = document.createElement('iframe');

	if (body && !document.getElementById(iframe.id)) {
		body.appendChild(iframe);
	};

	iframe.id = 'anytypeWebclipper-iframe';
	iframe.src = chrome.runtime.getURL('iframe/index.html');
	iframe.style.position = 'fixed';
	iframe.style.zIndex = 100000;
	iframe.style.width = '800px';
	iframe.style.height = '600px';
	iframe.style.background = '#fff';
	iframe.style.borderRadius = '12px';
	iframe.style.left = '50%';
	iframe.style.top = '50%';
	iframe.style.marginTop = '-300px';
	iframe.style.marginLeft = '-400px';
	iframe.style.border = 0;
	iframe.style.boxShadow = '0px 2px 28px rgba(0, 0, 0, 0.2)';
	iframe.style.display = 'none';

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