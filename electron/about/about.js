$(() => {
	var param = getParam();
	var closeButton = $('#close');
	var versionButton = $('#version-button');
	var lang = 'en-US';
	var versionText = '';

	try {
		lang = JSON.parse(localStorage.interfaceLang);
	} catch (e) {};

	document.title = 'Anytype';

	closeButton.on('click', e => {
		e.preventDefault();
		window.close();
	});

	versionButton.on('click', e => {
		e.preventDefault();

		var handler = (e) => {
			e.preventDefault();
			e.clipboardData.setData('text/plain', versionText);
			
			document.removeEventListener('copy', handler, true);
		};

		document.addEventListener('copy', handler, true);
		document.execCommand('copy');
	});

	$.ajax({
		url: `../../dist/lib/json/lang/${lang}.json`,
		method: 'GET',
		contentType: 'application/json',
		success: (data) => {
			versionText = [ data.electronAboutVersion, param.version ].join(' ');

			$('#description').text(data.electronAboutDescription);
			$('#copyright').text(data.electronAboutCopyright);
			$('#version').text(versionText);
		},
	});

});