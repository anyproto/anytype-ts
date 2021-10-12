var a = location.search.replace(/^\?/, '').split('&');
var param = {};

a.forEach((s) => {
    var kv = s.split('=');
    param[kv[0]] = kv[1];
});

document.title = 'Anytype';
document.getElementById('year').innerText = new Date().getFullYear();
document.getElementById('version').innerText = 'Version: ' + param.version;
document.getElementById('close').addEventListener('click', e => {
    e.preventDefault();
    window.close();
});