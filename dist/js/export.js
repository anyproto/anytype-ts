document.body.onload = function () {
    $(function () {
        var link = $('lnk');
        var a = $('a');
		var block = $('.block');
    
        link.off('click').on('click', function (e) {
            e.preventDefault();
            window.open($(this).attr('href'));
        });
    
        a.off('click').on('click', function (e) {
            e.preventDefault();
            window.open($(this).attr('href'));
        });

		block.each(function (i, item) {
			item = $(item);

			const toggle = item.find('.marker.toggle');

			toggle.off('click').on('click', function (e) {
				item.hasClass('isToggled') ? item.removeClass('isToggled') : item.addClass('isToggled');
			});
		});
    
    });
};