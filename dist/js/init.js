// Runs before the app bundle so the window gets its theme and background without a flash.
// Kept out of index.html, the app's CSP allows no inline scripts.
const theme = Electron.getTheme();
const bgColor = Electron.getBgColor();
const currentWindow = Electron.currentWindow();

if (theme) {
	document.documentElement.classList.add(`theme${ucFirst(theme)}`);
};

if (bgColor) {
	document.body.style.backgroundColor = bgColor;
};

if (currentWindow && currentWindow.views && (currentWindow.views.length > 1)) {
	document.getElementById('bubble-loader').classList.add('small');
};

function ucFirst (str) {
	return String(str || '').charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
