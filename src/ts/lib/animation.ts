import raf from 'raf';
import $ from 'jquery';

const DURATION = 0.15;

enum Direction {
	From =  0,
	To	 = 1,
};

class Animation {

	to (callBack?: () => void) {
		const nodes = this.initNodes({ opacity: 0, transform: 'scale3d(0.9,0.9, 1)' }, Direction.To);

		raf(() => {
			nodes.css({ opacity: 1, transform: 'scale3d(1,1,1)' });
		});

		if (callBack) {
			window.setTimeout(callBack, (nodes.length + 1) * DURATION * 1000);
		};
	};

	from (callBack?: () => void) {
		const nodes = this.initNodes({ opacity: 1, transform: 'scale3d(1,1,1)' }, Direction.From);

		raf(() => {
			nodes.css({ opacity: 0, transform: 'scale3d(0.9,0.9, 1)' });
		});

		if (callBack) {
			window.setTimeout(callBack, (nodes.length + 1) * DURATION * 1000);
		};
	};

	initNodes (css: any, dir: Direction) {
		const nodes = $('.animation');

		nodes.each((i: number, item: any) => {
			item = $(item);
			
			let index = 0;

			switch (dir) {
				case Direction.To: {
					index = Number(item.attr('data-animation-index-to')) || i;
					break;
				};

				case Direction.From: {
					index = Number(item.attr('data-animation-index-from')) || i;
					break;
				};
			};

			item.css({ ...css, transition: '' });

			raf(() => {
				item.css({
					transitionProperty: Object.keys(css).join(','),
					transitionDuration: `${DURATION}s`,
					transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
					transitionDelay: `${DURATION * index}s`,
				});
			});

			window.setTimeout(() => {
				item.css({ transition: '' });
			}, DURATION * (index + 1) * 1000);
		});

		return nodes;
	};

};

export default new Animation();