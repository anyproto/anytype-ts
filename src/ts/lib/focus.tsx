import { I } from 'ts/lib';
import { getRange, setRange } from 'selection-ranges';

const $ = require('jquery');

class Focus {
	
	focused: string = '';
	range: I.TextRange = { from: 0, to: 0 };
	
	set (id: string, range: I.TextRange): void {
		this.focused = String(id || '');
		this.range.from = Number(range.from) || 0;
		this.range.to = Number(range.to) || 0;
	};
	
	clear () {
		this.set('', { from: 0, to: 0 });
	};
	
	apply () {
		if (!this.focused) {
			return;
		};
		
		let el = $('#block-' + $.escapeSelector(this.focused));
		if (!el.length) {
			return;
		};
		
		let value = el.find('.value');
		if (!value.length) {
			return;
		};
		
		window.setTimeout(() => {
			window.getSelection().empty();
			value.focus();
			
			setRange(value.get(0), { start: this.range.from, end: this.range.to });
		});
	};
	
};

export let focus: Focus = new Focus();