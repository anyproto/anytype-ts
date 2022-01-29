document.body.onload = function () {
    $(function () {
        var link = $('lnk');
        var a = $('a');
    
        link.unbind('click').on('click', function (e) {
            window.open($(this).attr('href'));
        });
    
        a.unbind('click').on('click', function (e) {
            window.open($(this).attr('href'));
        });
    
    });
};