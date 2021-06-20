import { I, keyboard, Util } from 'ts/lib';
import { setRange } from 'selection-ranges';

const $ = require('jquery');
const Constant = require('json/constant.json');

interface State {
	focused: string;
	range: I.TextRange;
};

class Focus {
	
	state: State = { 
		focused: '', 
		range: { from: 0, to: 0 } 
	};

	prev: State = { 
		focused: '', 
		range: { from: 0, to: 0 } 
	};
	
	set (id: string, range: I.TextRange): Focus {
		if (!range) {
			return;
		};

		this.prev = { ...this.state };

		this.state = {
			focused: String(id || ''),
			range: {
				from: Number(range.from) || 0,
				to: Number(range.to) || 0,
			}
		};

		return this;
	};

	restore () {
		this.state = { ...this.prev };
	};

	clear (withRange: boolean) {
		this.clearRange(withRange);
		this.set('', { from: 0, to: 0 });
	};

	clearRange (withRange: boolean) {
		const { focused } = this.state;
		const el = $('.focusable.c' + focused);
		
		if (!el.length || el.hasClass('value')) {
			keyboard.setFocus(false);
		};

		if (withRange) {
			$(document.activeElement).blur();
			window.getSelection().empty();
			keyboard.setFocus(false);
		};
	};
	
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
			el.setSelectionRange(range.from, range.to);
		} else
		if (node.attr('contenteditable')) {
			keyboard.setFocus(true);
			setRange(el, { start: range.from, end: range.to });
		};

		return this;
	};
	
	scroll (isPopup: boolean, id?: string) {
		const { focused } = this.state;

		id = String(id || focused || '');
		if (!id) {
			return;
		};

		const node = $('.focusable.c' + id);
		if (!node.length) {
			return;
		};

		const container = isPopup ? $('#popupPage #innerWrap') : $(window);
		const h = container.height();
		const o = Constant.size.lastBlock + Util.sizeHeader();
		const st = container.scrollTop();

		let y = 0;
		if (isPopup) {
			y = node.offset().top - container.offset().top + st;
		} else {
			y = node.offset().top;
		};

		if ((y >= st) && (y <= st + h - o)) {
			return;
		};

		if (y >= h - o) {
			container.scrollTop(y - h + o);
		};
	};
	
};

export let focus: Focus = new Focus();