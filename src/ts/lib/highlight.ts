import $ from 'jquery';
import { Storage } from 'Lib';

const HIGHLIGHTS_MAP = {
	whatsNew: [ '#button-help', '#menuHelp #item-whatsNew' ],
	shortcut: [ '#button-help', '#menuHelp #item-shortcut' ],
	hints: [ '#button-help', '#menuHelp #item-hints' ],
};

class Highlight {

	showAll () {
		const highlights = Storage.get('highlights') || {};

		Object.keys(highlights).forEach((el) => {
			if (highlights[el]) {
				this.show(el);
			};
		});
	};

	show (key: string) {
		if (!HIGHLIGHTS_MAP[key] || !Storage.getHighlight(key)) {
			return;
		};

		HIGHLIGHTS_MAP[key].forEach(item => this.add($(item)));
	};

	hide (key: string) {
		Storage.setHighlight(key, false);

		if (HIGHLIGHTS_MAP[key]) {
			HIGHLIGHTS_MAP[key].forEach(item => { this.remove($(item)); });
		};
	};

	add (node) {
		if (!node || !node.length) {
			return;
		};

		if (node.find('.highlightMark').length) {
			return;
		};

		const dot = $('<div />').addClass('highlightMark');
		node.append(dot);
	};

	remove (node) {
		if (!node || !node.length) {
			return;
		};

		node.find('.highlightMark').remove();
	};

};

export default new Highlight();