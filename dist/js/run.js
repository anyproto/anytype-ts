const s = document.createElement('script');

s.src = './js/main.js?' + Math.random();
s.type = 'text/javascript';

document.body.appendChild(s);