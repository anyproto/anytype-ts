const s = document.createElement('script');

s.src = './js/main.js?' + Math.random();
s.type = 'text/javascript';
s.onerror = function() {
	console.error('Failed to load main.js');
	window.setTimeout(() => window.location.reload(), 1000);
};

document.body.appendChild(s);