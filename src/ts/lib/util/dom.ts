import raf from 'raf';
import * as I from 'Interface';

class UtilDom {

	esc (v: any): string {
		return CSS.escape(String(v));
	};

	get (id: string): HTMLElement | null {
		return document.getElementById(id);
	};

	select (selector: string, root: ParentNode = document): HTMLElement | null {
		if (!root) {
			return null;
		};

		try {
			return root.querySelector(selector);
		} catch (e) {
			console.error('Invalid selector:', selector);
			return null;
		};
	};

	selectAll (selector: string, root: ParentNode = document): HTMLElement[] {
		if (!root) {
			return [];
		};

		try {
			return Array.from(root.querySelectorAll(selector));
		} catch (e) {
			console.error('Invalid selector:', selector);
			return [];
		};
	};

	addClass (el: HTMLElement, ...names: string[]) {
		if (el) {
			el.classList.add(...names.flatMap(n => n.split(/\s+/).filter(Boolean)));
		};
	};

	removeClass (el: HTMLElement, ...names: string[]) {
		if (el) {
			el.classList.remove(...names.flatMap(n => n.split(/\s+/).filter(Boolean)));
		};
	};

	hasClass (el: HTMLElement, name: string): boolean {
		return el ? el.classList.contains(name) : false;
	};

	toggleClass (el: HTMLElement, name: string, force?: boolean) {
		if (el) {
			el.classList.toggle(name, force);
		};
	};

	contentWidth (el: HTMLElement | null): number {
		if (!el) {
			return 0;
		};
		const style = getComputedStyle(el);
		return el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
	};

	contentHeight (el: HTMLElement | null): number {
		if (!el) {
			return 0;
		};
		const style = getComputedStyle(el);
		return el.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
	};

	css (el: HTMLElement | null, styles: Partial<CSSStyleDeclaration>) {
		if (el) {
			Object.assign(el.style, styles);
		};
	};

	addEvent (target: EventTarget, name: string, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
		target.addEventListener(name, handler, options);
	};

	removeEvent (target: EventTarget, name: string, handler: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) {
		target.removeEventListener(name, handler, options);
	};

	addEvents (target: EventTarget, events: [string, EventListenerOrEventListenerObject][]) {
		events.forEach(([ name, handler ]) => this.addEvent(target, name, handler));
	};

	removeEvents (target: EventTarget, events: [string, EventListenerOrEventListenerObject][]) {
		events.forEach(([ name, handler ]) => this.removeEvent(target, name, handler));
	};

	eventDispatch (target: EventTarget, name: string, detail?: any) {
		target.dispatchEvent(detail !== undefined ? new CustomEvent(name, { detail }) : new CustomEvent(name));
	};

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
		(document.activeElement as HTMLElement)?.blur();
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

	getScrollContainer (isPopup: boolean): HTMLElement | null {
		return this.select(`#page.${this.getContainerClassName(isPopup)}`);
	};

	getScrollContainerTop (isPopup: boolean): number {
		return Math.ceil(this.getScrollContainer(isPopup)?.scrollTop ?? 0);
	};

	getPageFlexContainer (isPopup: boolean): HTMLElement | null {
		return this.select(`#pageFlex.${this.getContainerClassName(isPopup)}`);
	};

	getPageContainer (isPopup: boolean): HTMLElement | null {
		return this.select(`#page.${this.getContainerClassName(isPopup)}`);
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
		this.eventDispatch(window, 'resize');
	};

	getWindowDimensions (): { ww: number; wh: number } {
		return { ww: window.innerWidth, wh: window.innerHeight };
	};

	getMaxScrollHeight (isPopup: boolean): number {
		const el = this.getScrollContainer(isPopup);
		if (!el) {
			return 0;
		};

		return el.scrollHeight - el.clientHeight;
	};

	getAppContainerHeight (): number {
		const el = this.get('appContainer');
		return el ? this.contentHeight(el) : 0;
	};

	/**
	 * Adds a class to the HTML body with a given prefix and value.
	 * @param {string} prefix - The class prefix.
	 * @param {string} v - The value to append.
	 */
	private bodyClassRegexCache: Map<string, RegExp> = new Map();

	addBodyClass (prefix: string, v: string) {
		const el = document.documentElement;
		let reg = this.bodyClassRegexCache.get(prefix);

		if (!reg) {
			reg = new RegExp(`^${prefix}`);
			this.bodyClassRegexCache.set(prefix, reg);
		};

		const c = String(el.className || '').split(' ').filter(it => !it.match(reg));

		if (v) {
			c.push(U.String.toCamelCase(`${prefix}-${v}`));
		};

		el.className = c.join(' ');
	};

	/**
	 * Injects CSS into the document head with a given ID.
	 * @param {string} id - The style element ID.
	 * @param {string} css - The CSS string.
	 */
	injectCss (id: string, css: string) {
		const existing = this.select(`style#${id}`, document.head);
		if (existing) {
			existing.remove();
		};

		const style = document.createElement('style');
		style.id = id;
		style.type = 'text/css';
		style.textContent = css;
		document.head.appendChild(style);
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
		this.selectAll('audio, video').forEach((el: HTMLMediaElement) => el.pause());
	};

	renderLinks (obj: any) {
		if (!obj) {
			return;
		};

		const root = obj instanceof HTMLElement ? obj : obj;
		if (!root) {
			return;
		};

		const links = root.querySelectorAll('a');

		links.forEach((link: HTMLElement) => {
			this.removeEvent(link, 'click', link['_rl_click']);
			this.removeEvent(link, 'auxclick', link['_rl_aux']);

			const onClick = (e: MouseEvent) => {
				const href = link.getAttribute('href') || link.getAttribute('xlink:href');

				e.preventDefault();
				link.classList.contains('path') ? Action.openPath(href) : Action.openUrl(href);
			};

			const onAux = (e: MouseEvent) => e.preventDefault();

			link['_rl_click'] = onClick;
			link['_rl_aux'] = onAux;

			this.addEvent(link, 'click', onClick);
			this.addEvent(link, 'auxclick', onAux);
		});
	};

	/**
	 * Toggles the open/closed state of an element with animation.
	 * @param {any} obj - The element to toggle.
	 * @param {number} delay - The animation delay in ms.
	 * @param {boolean} isOpen - Whether the element is currently open.
	 * @param {function} [callBack] - Optional callback after toggle.
	 */
	toggle (obj: any, delay: number, isOpen: boolean, callBack?: () => void) {
		const el: HTMLElement = obj instanceof HTMLElement ? obj : obj;
		if (!el) {
			return;
		};

		if (isOpen) {
			const height = el.offsetHeight;

			this.css(el, { height: `${height}px`, overflow: 'hidden' });

			raf(() => {
				this.addClass(el, 'anim');
				this.css(el, { height: '0px' });
			});
			window.setTimeout(() => {
				this.removeClass(el, 'isOpen', 'anim');
				callBack?.();
			}, delay);
		} else {
			this.css(el, { height: 'auto' });

			const height = el.offsetHeight;

			this.css(el, { height: '0px' });
			this.addClass(el, 'anim');

			raf(() => { this.css(el, { height: `${height}px` }); });
			window.setTimeout(() => {
				this.removeClass(el, 'anim');
				this.addClass(el, 'isOpen');
				this.css(el, { height: 'auto', overflow: 'visible' });
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
		const node = this.select(`.focusable.c${U.Common.esc(item.id)}`);

		if (!node) {
			return;
		};

		const container = this.getScrollContainer(isPopup);

		if (!container) {
			return;
		};

		if (item.block && item.block.isTextTitle()) {
			container.scrollTop = 0;
			return;
		};

		const toggleClasses = [ I.TextStyle.Toggle, I.TextStyle.ToggleHeader1, I.TextStyle.ToggleHeader2, I.TextStyle.ToggleHeader3 ]
			.map(s => `.block.${U.Data.blockTextClass(s)}`).join(',');
		const toggle = node.closest(toggleClasses);

		if (toggle && !this.hasClass(toggle as HTMLElement, 'isToggled')) {
			S.Block.toggle(rootId, (toggle as HTMLElement).dataset.id, true);
		};

		const no = node.getBoundingClientRect().top;
		const co = container.getBoundingClientRect().top;
		const st = container.scrollTop;
		const offset = 20;
		const y = Math.max(J.Size.header + offset, no - co + st - J.Size.header - offset);

		container.scrollTop = y;
	};

};

export default new UtilDom();
