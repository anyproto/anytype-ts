import $ from 'jquery';
import { setRange } from 'selection-ranges';
import { I, C, U, J, keyboard } from 'Lib';

/**
 * Focus manages the focus state and text selection within the application.
 *
 * Key responsibilities:
 * - Tracking which block/element is currently focused
 * - Managing text selection ranges within focusable elements
 * - Applying focus state to the DOM
 * - Scrolling focused elements into view
 * - Backup/restore functionality for temporary focus changes
 *
 * The focus state includes both the focused element ID and the
 * text selection range within that element.
 */
class Focus {
	
	state: I.FocusState = { 
		focused: '', 
		range: { from: 0, to: 0 } 
	};

	backup: I.FocusState = { 
		focused: '', 
		range: { from: 0, to: 0 } 
	};
	
	/**
	 * Sets the focus state to the given block and range.
	 * @param {string} id - The block ID to focus.
	 * @param {I.TextRange} range - The text range to select.
	 * @returns {Focus} The Focus instance.
	 */
	set (id: string, range: I.TextRange): Focus {
		if (!range) {
			return;
		};

		this.state = {
			focused: String(id || ''),
			range: {
				from: Math.max(0, Number(range.from) || 0),
				to: Math.max(0, Number(range.to) || 0),
			},
		};
		this.backup = U.Common.objectCopy(this.state);

		C.BlockSetCarriage(keyboard.getRootId(), id, range);
		return this;
	};

	setWithTimeout (id: string, range: I.TextRange, delay: number): Focus {
		window.setTimeout(() => {
			this.set(id, range);
			this.apply();
		}, delay);
		return this;
	};

	/**
	 * Restores the focus state from backup.
	 */
	restore () {
		this.state = U.Common.objectCopy(this.backup);
	};

	/**
	 * Clears the focus state and optionally the selection range.
	 * @param {boolean} withRange - Whether to clear the selection range.
	 */
	clear (withRange: boolean) {
		this.clearRange(withRange);
		this.state = { focused: '', range: { from: 0, to: 0 } };
	};

	/**
	 * Clears the selection range and focus class from elements.
	 * @param {boolean} withRange - Whether to clear the selection range.
	 */
	clearRange (withRange: boolean) {
		const { focused } = this.state;
		const el = $(`.focusable.c${focused}`);
		
		if (!el.length || el.hasClass('value')) {
			keyboard.setFocus(false);
		};

		if (withRange) {
			U.Common.clearSelection();
			keyboard.setFocus(false);
		};

		$('.focusable.isFocused').removeClass('isFocused');
	};
	
	/**
	 * Applies the current focus state to the DOM.
	 * @returns {Focus} The Focus instance.
	 */
	apply (): Focus {
		const { focused, range } = this.state;
		if (!focused) {
			return;
		};

		$('.focusable.isFocused').removeClass('isFocused');

		const node = $(`.focusable.c${focused}`);
		if (!node.length) {
			return;
		};

		node.addClass('isFocused');

		const el = node.get(0);
		el.focus({ preventScroll: true });

		if (node.hasClass('input')) {
			window.setTimeout(() => {
				const input = el as HTMLInputElement;
				input.setSelectionRange(range.from, range.to);

				const style = window.getComputedStyle(input);
				if (style.direction === 'rtl') {
					input.scrollLeft = 0;
				};
			});
		} else
		if (node.hasClass('editable')) {
			keyboard.setFocus(true);
			setRange(el, { start: range.from, end: range.to });
		};
		return this;
	};
	
	/**
	 * Scrolls the focused element into view if needed.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @param {string} id - The block ID to scroll to.
	 */
	scroll (isPopup: boolean, id: string) {
		if (!id) {
			return;
		};

		const node = $(`.focusable.c${id}`);
		if (!node.length) {
			return;
		};

		let rect = U.Common.getSelectionRect();
		if (!rect) {
			rect = node.get(0).getBoundingClientRect();
		};
		if (!rect) {
			return;
		};

		const container = U.Common.getScrollContainer(isPopup);
		const ch = container.height();
		const st = container.scrollTop();
		const { header } = J.Size;
		const y = rect.top + st - container.offset().top;
		const top = st + header;
		const bottom = st + ch;

		if ((y < top) || (y > bottom)) {
			container.scrollTop(Math.max(0, y - ch / 2));
		};
	};

};

export const focus: Focus = new Focus();