var param = getParam();
var year = document.getElementById('year');
var closeButton = document.getElementById('close');
var version = document.getElementById('version');
var versionButton = document.getElementById('version-button');
var versionText = 'Version: ' + param.version;

document.title = 'Anytype';
year.innerText = new Date().getFullYear();
version.innerText = versionText;

closeButton.addEventListener('click', e => {
    e.preventDefault();
    window.close();
});

versionButton.addEventListener('click', e => {
    e.preventDefault();

	var handler = (e) => {
		e.preventDefault();
		e.clipboardData.setData('text/plain', versionText);
		
		document.removeEventListener('copy', handler, true);
	};

	document.addEventListener('copy', handler, true);
	document.execCommand('copy');
});