var param = getParam();

document.title = 'Anytype';
document.getElementById('year').innerText = new Date().getFullYear();
document.getElementById('version').innerText = 'Version: ' + param.version;
document.getElementById('close').addEventListener('click', e => {
    e.preventDefault();
    window.close();
});