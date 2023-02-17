import raf from 'raf';

const DELAY = 0.5;

enum Direction {
	From =  0,
	To	 = 1,
};

class Animation {

	to (callBack?: () => void) {
		const nodes = this.initNodes({ opacity: 0, transform: 'scale3d(0.95,0.95, 1)' }, Direction.To);

		window.setTimeout(() => {
			nodes.css({ opacity: 1, transform: 'scale3d(1,1,1)' });
			console.log('SET OPACITY', 1);
		}, DELAY * 1000);

		if (callBack) {
			window.setTimeout(callBack, (nodes.length + 1) * DELAY * 1000);
		};
	};

	from (callBack?: () => void) {
		const nodes = this.initNodes({ opacity: 1 }, Direction.From);

		raf(() => {
			nodes.css({ opacity: 0 });
			console.log('SET OPACITY', 0);
		});

		window.setTimeout(() => {
			if (callBack) {
				callBack();
			};
		}, (nodes.length + 1) * DELAY * 1000);
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

			console.log(dir, index, {
				transitionProperty: Object.keys(css).join(','),
				transitionDuration: `${DELAY}s`,
				transitionTimingFunction: 'ease-in-out',
				transitionDelay: `${DELAY * index}s`,
				...css,
			});

			item.css({ ...css, transition: '' });

			raf(() => {
				item.css({
					transitionProperty: Object.keys(css).join(','),
					transitionDuration: `${DELAY}s`,
					transitionTimingFunction: 'ease-in-out',
					transitionDelay: `${DELAY * index}s`,
				});
			});
		});

		return nodes;
	};

};

export default new Animation();