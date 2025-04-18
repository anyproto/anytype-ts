document.body.onload = function () {
    $(function () {
        var link = $('a');
		var block = $('.block');
		var bookmark = $('.block.blockBookmark .inner');

		var onUrl = function (e) {
            e.preventDefault();

			const el = $(this);
			const data = el.data();
			const url = data.href || el.attr('href');

            if (url) {
				window.open(url);
			};
        };
    
        //a.off('click').on('click', onUrl);
		link.off('click').on('click', onUrl);
		bookmark.off('click').on('click', onUrl);

		block.each(function (i, item) {
			item = $(item);

			const toggle = item.find('.marker.toggle');

			toggle.off('click').on('click', function (e) {
				item.hasClass('isToggled') ? item.removeClass('isToggled') : item.addClass('isToggled');
			});
		});
    
    });
};