$(() => {
	var param = getParam();
	var closeButton = $('#close');
	var versionButton = $('#version-button');
	var copyIcon = versionButton.find('.copy');
	var versionText = '';
	var timeout = 0;

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

		copyIcon.addClass('active');

		clearTimeout(timeout);
		setTimeout(() => { copyIcon.removeClass('active'); }, 2000);
	});

	$.ajax({
		url: `../../dist/lib/json/lang/${param.lang}.json`,
		method: 'GET',
		contentType: 'application/json',
		success: (data) => {
			versionText = [ data.electronAboutVersion, param.version ].join(' ');
			closeButton.text(data.commonClose);

			$('#description').text(data.electronAboutDescription);
			$('#copyright').text(data.electronAboutCopyright);
			$('#version').text(versionText);
		},
	});

});