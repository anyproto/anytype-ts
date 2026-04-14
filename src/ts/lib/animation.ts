import raf from 'raf';
import * as I from 'Interface';

const Duration = {
	Normal: 0.05,
	Word: 0.01,
};

/**
 * Converts an object with potentially numeric values to string values
 * suitable for Object.assign(el.style, ...).
 */
const toStringCss = (css: Record<string, any>): Partial<CSSStyleDeclaration> => {
	const result: any = {};
	for (const key of Object.keys(css)) {
		result[key] = String(css[key]);
	};
	return result;
};

class Animation {

	isAnimating = false;

	/**
	 * Animates elements to visible state with scaling and opacity.
	 * @param {() => void} [callBack] - Optional callback after animation.
	 */
	to (callBack?: () => void) {
		if (this.isAnimating) {
			return;
		};

		const css = { opacity: 0, transform: 'scale3d(0.9,0.9,1)' };

		this.isAnimating = true;
		this.initNodes(css, I.AnimDirection.To);

		raf(() => {
			const styles = toStringCss({ opacity: 1, transform: 'scale3d(1,1,1)' });

			U.Dom.selectAll('.animation').forEach(el => U.Dom.css(el, styles));
			U.Dom.selectAll('.animationWord').forEach(el => U.Dom.css(el, styles));
		});

		this.finish(callBack);
	};

	/**
	 * Animates elements from visible state to hidden with scaling and opacity.
	 * @param {() => void} [callBack] - Optional callback after animation.
	 */
	from (callBack?: () => void) {
		if (this.isAnimating) {
			return;
		};

		const css = { opacity: 1, transform: 'scale3d(1,1,1)' };

		this.isAnimating = true;
		this.initNodes(css, I.AnimDirection.From);

		raf(() => {
			const styles = toStringCss({ opacity: 0, transform: 'scale3d(0.9,0.9,1)' });

			U.Dom.selectAll('.animation').forEach(el => U.Dom.css(el, styles));
			U.Dom.selectAll('.animationWord').forEach(el => U.Dom.css(el, styles));
		});

		this.finish(callBack);
	};

	/**
	 * Finishes the animation and calls the callback after duration.
	 * @param {() => void} [callBack] - Optional callback after animation.
	 */
	finish (callBack?: () => void) {
		window.setTimeout(() => {
			this.isAnimating = false;
			callBack?.();
		}, this.getDuration());
	};

	/**
	 * Gets sorted animation nodes by direction and index.
	 * @param {I.AnimDirection} dir - Animation direction.
	 * @returns {Array<{el: HTMLElement, index: number, type: I.AnimType}>} Sorted nodes.
	 */
	getSortedNodes (dir: I.AnimDirection) {
		const nodes: { el: HTMLElement, index: number, type: I.AnimType }[] = [];

		U.Dom.selectAll('.animation').forEach((el, i) => {
			const type = Number(el.getAttribute('data-animation-type')) || I.AnimType.Normal;

			let index = 0;
			switch (dir) {
				case I.AnimDirection.To: {
					index = Number(el.getAttribute('data-animation-index-to')) || i;
					break;
				};

				case I.AnimDirection.From: {
					index = Number(el.getAttribute('data-animation-index-from')) || i;
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

	/**
	 * Initializes animation nodes with CSS and delay.
	 * @param {object} css - CSS properties to apply.
	 * @param {I.AnimDirection} dir - Animation direction.
	 * @returns {Array<{el: HTMLElement, index: number, type: I.AnimType}>} The nodes.
	 */
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
						el.innerHTML = el.getAttribute('data-content') || '';

						this.applyCss(el, css, Duration.Normal, delay);
						delay += Duration.Normal;
						break;
					};

					el.innerHTML = '';

					const processWord = (word: string | Node, space: boolean) => {
						const w = document.createElement('span');

						if (typeof word === 'string') {
							w.innerHTML = word;
						} else {
							w.appendChild(word);
						};

						U.Dom.addClass(w, 'animationWord');
						el.appendChild(w);

						if (space && (word != ' ')) {
							el.appendChild(document.createTextNode(' '));
						};

						this.applyCss(w, css, Duration.Word, delay);
						delay += Duration.Word;
					};

					const tempDiv = document.createElement('div');
					tempDiv.innerHTML = el.getAttribute('data-content') || '';

					Array.from(tempDiv.childNodes).forEach((child: ChildNode) => {
						if ((child as HTMLElement).tagName == 'BR') {
							el.appendChild(child);
							return;
						};

						if (child.nodeType == 3) {
							(child.textContent || '').trim().split(' ').forEach(it => processWord(it, true));
						} else {
							processWord(child as Node, false);
						};
					});
					break;
				};
			};
		};

		return nodes;
	};

	/**
	 * Applies CSS transition to an element.
	 * @param {HTMLElement} obj - The element.
	 * @param {object} css - CSS properties.
	 * @param {number} duration - Duration in seconds.
	 * @param {number} delay - Delay in seconds.
	 */
	applyCss (obj: HTMLElement, css: object, duration: number, delay: number) {
		U.Dom.css(obj, { ...toStringCss(css as Record<string, any>), transition: '' });

		raf(() => {
			U.Dom.css(obj, {
				transitionProperty: Object.keys(css).join(','),
				transitionDuration: `${duration}s`,
				transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
				transitionDelay: `${delay}s`,
			});
		});

		window.setTimeout(() => { U.Dom.css(obj, { transition: '' }); }, (delay + duration) * 1000);
	};

	/**
	 * Gets the total animation duration in milliseconds.
	 * @returns {number} The duration in ms.
	 */
	getDuration () {
		const blockLength = U.Dom.selectAll('.animation').length;
		const wordLength = U.Dom.selectAll('.animationWord').length;

		return (blockLength * Duration.Normal + wordLength * Duration.Word) * 1000;
	};

};

export default new Animation();
