import $ from 'jquery';
import raf from 'raf';
import * as I from 'Interface';

class UtilDom {

	/**
	 * Returns the current selection range in the window.
	 * @returns {Range|null} The selection range or null if none.
	 */
	getSelectionRange (): Range {
		const sel: Selection = window.getSelection();
		let range: Range = null;

		if (sel && (sel.rangeCount > 0)) {
			range = sel.getRangeAt(0);
		};

		return range;
	};

	/**
	 * Returns the bounding rectangle of the current selection.
	 * @returns {object|null} The rectangle or null if no selection.
	 */
	getSelectionRect () {
		let rect: any = { x: 0, y: 0, width: 0, height: 0 };

		const range = this.getSelectionRange();
		if (range) {
			rect = range.getBoundingClientRect() as DOMRect;
		};

		rect = U.Common.objectCopy(rect);

		if (!rect.x && !rect.y && !rect.width && !rect.height) {
			rect = null;
		};

		return rect;
	};

	/**
	 * Returns the bounding rectangle of an element.
	 */
	getElementRect (element: any): DOMRect | null {
		return element ? (element.getBoundingClientRect() as DOMRect) : null;
	};

	/**
	 * Clears the current selection in the document.
	 */
	clearSelection () {
		$(document.activeElement).trigger('blur');
		const selection = window.getSelection();
		if (selection) {
			selection.removeAllRanges();
		};
	};

	/**
	 * Returns the container class name based on popup state.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @returns {string} The container class name.
	 */
	getContainerClassName (isPopup: boolean): string {
		return isPopup ? 'isPopup' : 'isFull';
	};

	/**
	 * Returns the scroll container jQuery object depending on popup state.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @returns {JQuery<HTMLElement>} The scroll container.
	 */
	getScrollContainer (isPopup: boolean) {
		return $(`#page.${this.getContainerClassName(isPopup)}`);
	};

	/**
	 * Returns the scroll top position of the scroll container.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @returns {number} The scroll top position.
	 */
	getScrollContainerTop (isPopup: boolean) {
		return Math.ceil(this.getScrollContainer(isPopup).scrollTop());
	};

	/**
	 * Returns the page flex container jQuery object depending on popup state.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @returns {JQuery<HTMLElement>} The page flex container.
	 */
	getPageFlexContainer (isPopup: boolean) {
		return $(`#pageFlex.${this.getContainerClassName(isPopup)}`);
	};

	/**
	 * Returns the page container jQuery object depending on popup state.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @returns {JQuery<HTMLElement>} The page container.
	 */
	getPageContainer (isPopup: boolean) {
		return $(`#page.${this.getContainerClassName(isPopup)}`);
	};

	/**
	 * Returns the selector for a cell container based on type.
	 * @param {string} type - The type of container.
	 * @returns {string} The selector string.
	 */
	getCellContainer (type: string) {
		switch (type) {
			default:
			case 'page':
				return '#pageFlex.isFull';

			case 'popup':
				return '#pageFlex.isPopup';

			case 'menuBlockAdd':
				return `#${type}`;

			case 'popupRelation':
				return `#${type}-innerWrap`;

			case 'sidebarRight':
				return `#sidebarRight`;
		};
	};

	/**
	 * Returns the event namespace for editor resize events.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @returns {string} The event namespace.
	 */
	getEventNamespace (isPopup: boolean): string {
		return isPopup ? '-popup' : '';
	};

	/**
	 * Triggers a resize event for the editor.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 */
	triggerResizeEditor (isPopup: boolean) {
		$(window).trigger(`resize.editor${this.getEventNamespace(isPopup)}`);
	};

	/**
	 * Get width and height of window DOM node
	 */
	getWindowDimensions (): { ww: number; wh: number } {
		const win = $(window);
		return { ww: win.width(), wh: win.height() };
	};

	/**
	 * Returns the max scroll height of a container.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @returns {number} The max scroll height.
	 */
	getMaxScrollHeight (isPopup: boolean): number {
		const container = this.getScrollContainer(isPopup);
		if (!container.length) {
			return 0;
		};

		const el = container.get(0);
		return el.scrollHeight - el.clientHeight;
	};

	/**
	 * Returns the height of the app container.
	 */
	getAppContainerHeight () {
		return $('#appContainer').height();
	};

	/**
	 * Adds a class to the HTML body with a given prefix and value.
	 * @param {string} prefix - The class prefix.
	 * @param {string} v - The value to append.
	 */
	addBodyClass (prefix: string, v: string) {
		const obj = $('html');
		const reg = new RegExp(`^${prefix}`);
		const c = String(obj.attr('class') || '').split(' ').filter(it => !it.match(reg));

		if (v) {
			c.push(U.String.toCamelCase(`${prefix}-${v}`));
		};

		obj.attr({ class: c.join(' ') });
	};

	/**
	 * Injects CSS into the document head with a given ID.
	 * @param {string} id - The style element ID.
	 * @param {string} css - The CSS string.
	 */
	injectCss (id: string, css: string) {
		const head = $('head');
		const element = $(`<style id="${id}" type="text/css">${css}</style>`);

		head.find(`style#${id}`).remove();
		head.append(element);
	};

	/**
	 * Copies computed CSS styles from one element to another.
	 * @param {HTMLElement} src - The source element.
	 * @param {HTMLElement} dst - The destination element.
	 */
	copyCssSingle (src: HTMLElement, dst: HTMLElement) {
		const styles = window.getComputedStyle(src, '');

		if (styles.display && (styles.getPropertyValue('display') == 'none')) {
			return;
		};

		const css: any = [];

		for (let i = 0; i < styles.length; i++) {
			const name = styles[i];
			const value = styles.getPropertyValue(name);

			css[name] = value;
			css.push(`${name}: ${value}`);
		};

		css.push('visibility: visible');
		dst.style.cssText = css.join('; ');
	};

	/**
	 * Recursively copies computed CSS styles from one element and its children to another.
	 * @param {HTMLElement} src - The source element.
	 * @param {HTMLElement} dst - The destination element.
	 */
	copyCss (src: HTMLElement, dst: HTMLElement) {
		this.copyCssSingle(src, dst);

		const srcList = src.getElementsByTagName('*');
		const dstList = dst.getElementsByTagName('*');

		for (let i = 0; i < srcList.length; i++) {
			const srcElement = srcList[i] as HTMLElement;
			const dstElement = dstList[i] as HTMLElement;

			this.copyCssSingle(srcElement, dstElement);
		};
	};

	/**
	 * Pauses all audio and video elements on the page.
	 */
	pauseMedia () {
		$('audio, video').each((i: number, item: any) => item.pause());
	};

	/**
	 * Attaches click handlers to links in a jQuery object to open URLs or paths.
	 * @param {any} obj - The jQuery object containing links.
	 */
	renderLinks (obj: any) {
		const links = obj.find('a');

		links.off('click auxclick');
		links.on('auxclick', e => e.preventDefault());
		links.click((e: any) => {
			const el = $(e.currentTarget);
			const href = el.attr('href') || el.attr('xlink:href');

			e.preventDefault();
			el.hasClass('path') ? Action.openPath(href) : Action.openUrl(href);
		});
	};

	/**
	 * Toggles the open/closed state of an element with animation.
	 * @param {any} obj - The jQuery object to toggle.
	 * @param {number} delay - The animation delay in ms.
	 * @param {boolean} isOpen - Whether the element is currently open.
	 * @param {function} [callBack] - Optional callback after toggle.
	 */
	toggle (obj: any, delay: number, isOpen: boolean, callBack?: () => void) {
		if (isOpen) {
			const height = obj.outerHeight();

			obj.css({ height, overflow: 'hidden' });

			raf(() => obj.addClass('anim').css({ height: 0 }));
			window.setTimeout(() => {
				obj.removeClass('isOpen anim');
				callBack?.();
			}, delay);
		} else {
			obj.css({ height: 'auto' });

			const height = obj.outerHeight();

			obj.css({ height: 0 }).addClass('anim');

			raf(() => obj.css({ height }));
			window.setTimeout(() => {
				obj.removeClass('anim').addClass('isOpen').css({ height: 'auto', overflow: 'visible' });
				callBack?.();
			}, delay);
		};
	};

	/**
	 * Calculates text offset from DOM selection, accounting for rendered LaTeX elements.
	 * @param {HTMLElement} root - The root editable element.
	 * @param {Node} container - The selection container node.
	 * @param {number} offset - The selection offset within the container.
	 * @returns {number} The calculated text offset.
	 */
	getSelectionOffsetWithLatex (root: HTMLElement, container: Node, offset: number): number {
		let result = 0;

		const walk = (node: Node): boolean => {
			if (node.nodeType === Node.ELEMENT_NODE) {
				const el = node as HTMLElement;

				if (el.tagName?.toLowerCase() === 'markuplatex') {
					const latexLength = parseInt(el.dataset.latexLength || '0', 10);

					if (el.contains(container)) {
						result += latexLength;
						return true;
					};

					result += latexLength;
					return false;
				};

				for (let i = 0; i < node.childNodes.length; i++) {
					if (walk(node.childNodes[i])) {
						return true;
					};
				};

				return false;
			};

			if (node.nodeType === Node.TEXT_NODE) {
				if (node === container) {
					result += offset;
					return true;
				};

				result += node.textContent?.length || 0;
				return false;
			};

			return false;
		};

		walk(root);
		return result;
	};

	/**
	 * Scrolls to header in Table of contents
	 * @param {string} rootId - The root ID of the page.
	 * @param {any} item - The item to scroll to.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 */
	scrollToHeader (rootId: string, item: any, isPopup: boolean) {
		const node = $(`.focusable.c${U.Common.esc(item.id)}`);

		if (!node.length) {
			return;
		};

		const container = this.getScrollContainer(isPopup);

		if (item.block && item.block.isTextTitle()) {
			container.scrollTop(0);
			return;
		};

		const toggleClasses = [ I.TextStyle.Toggle, I.TextStyle.ToggleHeader1, I.TextStyle.ToggleHeader2, I.TextStyle.ToggleHeader3 ]
			.map(s => `.block.${U.Data.blockTextClass(s)}`).join(',');
		const toggles = node.parents(toggleClasses);

		if (toggles.length) {
			const toggle = $(toggles.get(0));
			if (!toggle.hasClass('isToggled')) {
				S.Block.toggle(rootId, toggle.attr('data-id'), true);
			};
		};

		const no = node.offset().top;
		const st = container.scrollTop();
		const offset = 20;
		const y = Math.max(J.Size.header + offset, no - container.offset().top + st - J.Size.header - offset);

		container.scrollTop(y);
	};

};

export default new UtilDom();
