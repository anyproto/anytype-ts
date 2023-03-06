import raf from 'raf';
import $ from 'jquery';
import { I } from 'Lib';

const Duration = {
	Normal: 0.3,
	Word: 0.1,
};

const WORD_DELAY_COEF = 0.75;

class Animation {

	to (callBack?: () => void) {
		const css = { opacity: 0, transform: 'translate3d(0px,10%,0px)' };
		
		this.initNodes(css, I.AnimDirection.To);

		raf(() => {
			const css = { opacity: 1, transform: 'translate3d(0px,0px,0px)' };

			$('.animation').css(css);
			$('.animationWord').css(css);
		});

		if (callBack) {
			window.setTimeout(callBack, this.getDuration());
		};
	};

	from (callBack?: () => void) {
		const css = { opacity: 1, transform: 'translate3d(0px,0px,0px)' };
		this.initNodes(css, I.AnimDirection.From);

		raf(() => {
			const css = { opacity: 0, transform: 'translate3d(0px,-10%,0px)' };

			$('.animation').css(css);
			$('.animationWord').css(css);
		});

		if (callBack) {
			window.setTimeout(callBack, this.getDuration());
		};
	};

	getSortedNodes (dir: I.AnimDirection) {
		const nodes: { el: JQuery<HTMLElement>, index: number, type: I.AnimType}[] = [];

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

	initNodes (css: object, dir: I.AnimDirection) {
		const nodes = this.getSortedNodes(dir);

		let delay = 0;

		for (const node of nodes) {
			const { el, type } = node;

			switch (type) {
				case I.AnimType.Normal: {
					this.applyCss(el, css, Duration.Normal, delay);
					delay += Duration.Normal;
					break;
				};

				case I.AnimType.Text: {
					if (dir == I.AnimDirection.From) {
						this.applyCss(el, css, Duration.Normal, delay);
						delay += Duration.Normal;
						break;
					};

					el.html('');

					const processWord = (word) => {
						const w = $('<span></span>').html(word).addClass('animationWord');
						el.append(w);
						el.append(' ');
						this.applyCss(w, css, Duration.Word, delay);
						delay += Duration.Word * WORD_DELAY_COEF;
					}

					$(`<div>${el.attr('data-content')}</div>`).contents().toArray().forEach(child => {
						if (child.nodeType === 3) {
							child.textContent.trim().split(' ').forEach(processWord);
						} else {
							processWord(child)
						};
					});
					break;
				};
			};
		};

		return nodes;
	};

	applyCss (obj: JQuery<HTMLElement>, css: object, duration: number, delay: number) {
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
		return ($('.animation').length * Duration.Normal + $('.animationWord').length * Duration.Word * WORD_DELAY_COEF) * 1000;
	};

};

export default new Animation();