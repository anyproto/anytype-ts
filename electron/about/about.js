$(() => {
	var param = getParam();
	var closeButton = $('#close');
	var version = $('#version');
	var versionButton = $('#version-button');
	var versionText = 'Version: ' + param.version;
	var lang = 'en-US';

	try {
		lang = JSON.parse(localStorage.interfaceLang);
	} catch (e) {};

	document.title = 'Anytype';
	version.text(versionText);

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
			$('#description').text(data.electronAboutDescription);
			$('#copyright').text(data.electronAboutCopyright);
		},
	});

});