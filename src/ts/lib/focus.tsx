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
		this.focused = '';
		this.range.from = 0;
		this.range.to = 0;
		
		if (withRange) {
			window.getSelection().empty();	
		};
	};
	
	apply (scroll?: boolean) {
		if (!this.focused) {
			return;
		};
		
		const el = $('#block-' + $.escapeSelector(this.focused));
		if (!el.length) {
			return;
		};
		
		const value = el.find('.value');
		if (!value.length) {
			return;
		};
		
		value.focus();
		setRange(value.get(0), { start: this.range.from, end: this.range.to });
		keyboard.setFocus(true);
		
		if (scroll) {
			const win = $(window);
			const rect = el.get(0).getBoundingClientRect() as DOMRect;
			const st = win.scrollTop();
		
			win.scrollTop(st + rect.y);
		};
	};
	
};

export let focus: Focus = new Focus();