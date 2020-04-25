import { I, keyboard } from 'ts/lib';
import { getRange, setRange } from 'selection-ranges';

const $ = require('jquery');
const Constant = require('json/constant.json');

class Focus {
	
	focused: string = '';
	range: I.TextRange = { from: 0, to: 0 };
	
	set (id: string, range: I.TextRange): void {
		if (!id || !range) {
			return;
		};
		
		this.focused = String(id || '');
		this.range.from = Number(range.from) || 0;
		this.range.to = Number(range.to) || 0;
	};
	
	clear (withRange: boolean) {
		this.focused = '';
		this.range.from = 0;
		this.range.to = 0;
		
		$('.focusable.isFocused').removeClass('isFocused');
		
		const el = $('.focusable.c' + this.focused);
		if (!el.length || el.hasClass('value')) {
			keyboard.setFocus(false);
		};
		
		if (withRange) {
			window.getSelection().empty();
			keyboard.setFocus(false);
			$(document.activeElement).blur();
		};
	};
	
	apply () {
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
	};
	
	scroll () {
		if (!this.focused) {
			return;
		};
		
		const node = $('.focusable.c' + this.focused);
		if (!node.length) {
			return;
		};
		
		const win = $(window);
		const top = win.scrollTop();
		const wh = win.height();
		const y = node.offset().top;
		const offset = Constant.size.lastBlock + Constant.size.header;
		
		if (y >= top + wh - offset) {
			$('html, body').stop(true, true).animate({ scrollTop: y - wh + offset }, 150);
		};
	};
	
};

export let focus: Focus = new Focus();