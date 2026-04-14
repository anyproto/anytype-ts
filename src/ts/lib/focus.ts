import { setRange } from 'selection-ranges';
import * as I from 'Interface';

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
		const el = U.Dom.select(`.focusable.c${U.Common.esc(focused)}`);

		if (!el || U.Dom.hasClass(el, 'value')) {
			keyboard.setFocus(false);
		};

		if (withRange) {
			U.Dom.clearSelection();
			keyboard.setFocus(false);
		};

		// Clear selection overlay for non-text blocks
		if (focused) {
			const target = U.Dom.get(`selectionTarget-${focused}`);
			if (target) {
				U.Dom.removeClass(target, 'isKeyboardFocused');
			};
		};

		U.Dom.selectAll('.focusable.isFocused').forEach(el => U.Dom.removeClass(el, 'isFocused'));
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

		U.Dom.selectAll('.focusable.isFocused').forEach(el => U.Dom.removeClass(el, 'isFocused'));
		U.Dom.selectAll('.selectionTarget.isKeyboardFocused').forEach(el => U.Dom.removeClass(el, 'isKeyboardFocused'));

		const node = U.Dom.select(`.focusable.c${U.Common.esc(focused)}`);
		if (!node) {
			return;
		};

		U.Dom.addClass(node, 'isFocused');

		node.focus({ preventScroll: true });

		// Show selection overlay for non-text blocks.
		// Must be after node.focus() because the previous text block's
		// blur handler calls focus.clear() which would remove the class.
		if (!U.Dom.hasClass(node, 'value')) {
			const target = U.Dom.get(`selectionTarget-${focused}`);
			if (target) {
				U.Dom.addClass(target, 'isKeyboardFocused');
			};
		};

		if (U.Dom.hasClass(node, 'input')) {
			window.setTimeout(() => {
				const input = node as HTMLInputElement;
				input.setSelectionRange(range.from, range.to);

				const style = window.getComputedStyle(input);
				if (style.direction === 'rtl') {
					input.scrollLeft = 0;
				};
			});
		} else
		if (U.Dom.hasClass(node, 'editable')) {
			keyboard.setFocus(true);

			// Convert model offsets to DOM offsets if ZWS cursor anchors are present
			if (Mark.hasZws(node)) {
				const domFrom = Mark.modelToDom(range.from, node);
				const domTo = Mark.modelToDom(range.to, node);

				setRange(node, { start: domFrom, end: domTo });
			} else {
				setRange(node, { start: range.from, end: range.to });
			};

			const style = window.getComputedStyle(node);
			if (style.direction === 'rtl') {
				const selection = window.getSelection();
				if (selection && selection.rangeCount) {
					const r = selection.getRangeAt(0);
					const rect = r.getBoundingClientRect();
					const parentRect = node.getBoundingClientRect();

					if (rect.left < parentRect.left) {
						node.scrollLeft = node.scrollLeft - (parentRect.left - rect.left);
					};
				};
			};
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

		const node = U.Dom.select(`.focusable.c${U.Common.esc(id)}`);
		if (!node) {
			return;
		};

		let rect = U.Dom.getSelectionRect();
		if (!rect) {
			rect = U.Dom.getElementRect(node);
		};
		if (!rect) {
			return;
		};

		const container = U.Dom.getScrollContainer(isPopup);
		if (!container) {
			return;
		};

		const ch = container.clientHeight;
		const st = container.scrollTop;
		const { header } = J.Size;
		const containerRect = container.getBoundingClientRect();
		const y = rect.top + st - containerRect.top;
		const top = st + header;
		const bottom = st + ch;

		if ((y < top) || (y > bottom)) {
			container.scrollTop = Math.max(0, y - ch / 2);
		};
	};

};

export const focus: Focus = new Focus();