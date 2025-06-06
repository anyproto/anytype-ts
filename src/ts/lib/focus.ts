import $ from 'jquery';
import { setRange } from 'selection-ranges';
import { I, C, U, J, keyboard } from 'Lib';

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
		const el = $('.focusable.c' + focused);
		
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

		const node = $('.focusable.c' + focused);
		if (!node.length) {
			return;
		};

		node.addClass('isFocused');

		const el = node.get(0);
		el.focus({ preventScroll: true });

		if (node.hasClass('input')) {
			window.setTimeout(() => (el as HTMLInputElement).setSelectionRange(range.from, range.to));
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

		const container = U.Common.getScrollContainer(isPopup);
		const ch = container.height();
		const no = node.offset().top;
		const hh = J.Size.header;
		const o = J.Size.lastBlock + hh;
		const st = container.scrollTop();
		const y = isPopup ? (no - container.offset().top + st) : no;

		if ((y >= st) && (y <= st + ch - o)) {
			return;
		};

		container.scrollTop(Math.max(y, ch - o) - ch + o);
	};

};

 export const focus: Focus = new Focus();