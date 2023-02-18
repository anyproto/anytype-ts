import raf from 'raf';
import $ from 'jquery';
import { I } from 'Lib';

const Duration = {
	Normal: 0.3,
	Word: 0.075,
};

class Animation {

	to (callBack?: () => void) {
		const css = { opacity: 0, transform: 'translate3d(0px,20%,0px)' };
		
		this.initNodes(css, I.AnimDirection.To);

		raf(() => {
			const css = { opacity: 1, transform: 'translate3d(0px,0px,0px)' };

			$('.animation').css(css);
			$('.animationWord').css(css);
		});

		if (callBack) {
			window.setTimeout(callBack, this.getDuration() * 1000);
		};
	};

	from (callBack?: () => void) {
		const css = { opacity: 1, transform: 'translate3d(0px,0px,0px)' };
		this.initNodes(css, I.AnimDirection.From);

		raf(() => {
			const css = { opacity: 0, transform: 'translate3d(0px,-20%,0px)' };

			$('.animation').css(css);
			$('.animationWord').css(css);
		});

		if (callBack) {
			window.setTimeout(callBack, this.getDuration() * 1000);
		};
	};

	getSortedNodes (dir: I.AnimDirection) {
		const nodes = [];

		$('.animation').each((i: number, el: any) => {
			el = $(el);

			const type = Number(el.attr('data-animation-type')) || I.AnimType.Normal;

			let index = 0;
			switch (dir) {
				case I.AnimDirection.To: {
					index = Number(el.attr('data-animation-index-to')) || i;
					break;
				};

				case I.AnimDirection.From: {
					index = Number(el.attr('data-animation-index-from')) || i;
					break;
				};
			};

			nodes.push({ el, index, type });
		});

		nodes.sort((c1, c2) => {
			if (c1.index > c2.index) return 1;
			if (c1.index < c2.index) return -1;
			return 0;
		});

		return nodes;
	};

	initNodes (css: any, dir: I.AnimDirection) {
		const nodes = this.getSortedNodes(dir);

		let n = 0;
		let delay = 0;

		for (let node of nodes) {
			let { el, type } = node;

			switch (type) {
				case I.AnimType.Normal: {
					this.applyCss(el, css, Duration.Normal, delay);
					delay += Duration.Normal;
					break;
				};

				case I.AnimType.Text: {
					el.html(el.attr('data-content'));

					if (dir == I.AnimDirection.From) {
						this.applyCss(el, css, Duration.Normal, delay);
						delay += Duration.Normal;
						break;
					};

					const html = el.html();
					const words = html.split(' ');

					el.html('');

					words.forEach(word => {
						const w = $('<span></span>').text(word).addClass('animationWord');

						el.append(w);
						el.append(' ');

						this.applyCss(w, css, Duration.Word, delay);
						delay += Duration.Word;
						n++;
					});
					break;
				};
			};

			n++;
		};

		return nodes;
	};

	applyCss (obj, css: any, duration: number, delay: number) {
		obj.css({ ...css, transition: '' });

		raf(() => {
			obj.css({
				transitionProperty: Object.keys(css).join(','),
				transitionDuration: `${duration}s`,
				transitionTimingFunction: 'ease-in-out',
				transitionDelay: `${delay}s`,
			});
		});

		window.setTimeout(() => { obj.css({ transition: '' }); }, (delay + duration) * 1000);
	};

	getDuration () {
		return $('.animation').length * Duration.Normal + $('.animationWord').length * Duration.Word;
	};

};

export default new Animation();