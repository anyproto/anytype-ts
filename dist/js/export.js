var link = document.querySelectorAll('lnk');

link.forEach(function (el) {
    el.addEventListener('click', function (e) {
        window.open(el.getAttribute('href'));
    });
});