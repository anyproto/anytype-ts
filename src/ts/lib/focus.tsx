import { I, keyboard } from 'ts/lib';
import { setRange } from 'selection-ranges';

const $ = require('jquery');
const Constant = require('json/constant.json');

class Focus {
	
	focused: string = '';
	range: I.TextRange = { from: 0, to: 0 };
	
	set (id: string, range: I.TextRange): Focus {
		if (!range) {
			return;
		};
		
		this.focused = String(id || '');
		this.range.from = Number(range.from) || 0;
		this.range.to = Number(range.to) || 0;

		return this;
	};
	
	clear (withRange: boolean) {
		this.clearRange(withRange);
		this.set('', { from: 0, to: 0 });
	};

	clearRange (withRange: boolean) {
		const focusable = $('.focusable.isFocused');
		const el = $('.focusable.c' + this.focused);
		
		if (!el.length || el.hasClass('value')) {
			keyboard.setFocus(false);
		};

		if (focusable.length) {
			focusable.removeClass('isFocused');
		};
		
		if (withRange) {
			$(document.activeElement).blur();
			window.getSelection().empty();
			keyboard.setFocus(false);
		};
	};
	
	apply (): Focus {
		if (!this.focused) {
			return;
		};
		
		const node = $('.focusable.c' + this.focused);
		if (!node.length) {
			return;
		};

		$('.focusable.isFocused').removeClass('isFocused');
		node.addClass('isFocused');
		
		const el = node.get(0);
		el.focus();

		if (node.hasClass('input')) {
			el.setSelectionRange(this.range.from, this.range.to);
		} else
		if (node.attr('contenteditable')) {
			keyboard.setFocus(true);
			setRange(el, { start: this.range.from, end: this.range.to });
		};

		return this;
	};
	
	scroll (container: any, id?: string) {
		id = String(id || this.focused || '');
		if (!id) {
			return;
		};

		const node = $('.focusable.c' + id);
		if (!node.length) {
			return;
		};

		const wh = container.height();
		const y = node.offset().top;
		const offset = Constant.size.lastBlock + Constant.size.header;
		const st = container.scrollTop();

		if ((y >= st) && (y <= st + wh - offset)) {
			return;
		};

		if (y >= wh - offset) {
			container.scrollTop(y - wh + offset);
		};
	};
	
};

export let focus: Focus = new Focus();