import { I, keyboard } from 'ts/lib';
import { getRange, setRange } from 'selection-ranges';

const $ = require('jquery');

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
		const el = $('.focusable.c' + this.focused);
		
		this.focused = '';
		this.range.from = 0;
		this.range.to = 0;
		
		if (withRange) {
			window.getSelection().empty();
			window.focus();
		};
		
		$('.focusable.isFocused').removeClass('isFocused');
		
		if (!el.length || el.hasClass('value')) {
			keyboard.setFocus(false);
		};
	};
	
	apply () {
		if (!this.focused) {
			return;
		};
		
		const el = $('.focusable.c' + this.focused);
		if (!el.length) {
			return;
		};

		$('.focusable.isFocused').removeClass('isFocused');
		el.focus().addClass('isFocused');
		
		setRange(el.get(0), { start: this.range.from, end: this.range.to });
		keyboard.setFocus(el.hasClass('value'));
	};
	
};

export let focus: Focus = new Focus();