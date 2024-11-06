import raf from 'raf';
import $ from 'jquery';
import { I } from 'Lib';

const Duration = {
	Normal: 0.05,
	Word: 0.01,
};

class Animation {

	isAnimating = false;

	to (callBack?: () => void) {
		if (this.isAnimating) {
			return;
		};

		const css = { opacity: 0, transform: 'scale3d(0.9,0.9,1)' };

		this.isAnimating = true;
		this.initNodes(css, I.AnimDirection.To);

		raf(() => {
			const css = { opacity: 1, transform: 'scale3d(1,1,1)' };

			$('.animation').css(css);
			$('.animationWord').css(css);
		});

		this.finish(callBack);
	};

	from (callBack?: () => void) {
		if (this.isAnimating) {
			return;
		};

		const css = { opacity: 1, transform: 'scale3d(1,1,1)' };

		this.isAnimating = true;
		this.initNodes(css, I.AnimDirection.From);

		raf(() => {
			const css = { opacity: 0, transform: 'scale3d(0.9,0.9,1)' };

			$('.animation').css(css);
			$('.animationWord').css(css);
		});

		this.finish(callBack);
	};

	finish (callBack?: () => void) {
		window.setTimeout(() => {
			this.isAnimating = false;

			if (callBack) {
				callBack();
			};
		}, this.getDuration());
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
						el.html(el.attr('data-content'));

						this.applyCss(el, css, Duration.Normal, delay);
						delay += Duration.Normal;
						break;
					};

					el.html('');

					const processWord = (word, space) => {
						const w = $('<span></span>').html(word).addClass('animationWord');

						el.append(w);

						if (space && (word != ' ')) {
							el.append(' ');
						};

						this.applyCss(w, css, Duration.Word, delay);
						delay += Duration.Word;
					};

					$(`<div>${el.attr('data-content')}</div>`).contents().toArray().forEach((child: any) => {
						if (child.tagName == 'BR') {
							el.append(child);
							return;
						};

						if (child.nodeType == 3) {
							child.textContent.trim().split(' ').forEach(it => processWord(it, true));
						} else {
							processWord(child, false);
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
		const blockLength = $('.animation').length;
		const wordLength = $('.animationWord').length;

		return (blockLength * Duration.Normal + wordLength * Duration.Word) * 1000;
	};

};

export default new Animation();