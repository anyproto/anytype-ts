import $ from 'jquery';
import { Storage } from 'Lib';

const HIGHLIGHTS_MAP = {
	whatsNew: [ '#button-help', '#menuHelp #item-whatsNew' ],
	shortcut: [ '#button-help', '#menuHelp #item-shortcut' ],
	hints: [ '#button-help', '#menuHelp #item-hints' ],
	createSpace: [ '#button-create-space' ],
};

class Highlight {

	/**
	 * Shows all highlights based on stored highlight keys.
	 */
	showAll () {
		const highlights = Storage.get('highlights') || {};

		Object.keys(highlights).forEach((el) => {
			if (highlights[el]) {
				this.show(el);
			};
		});
	};

	/**
	 * Shows highlight for a specific key.
	 * @param {string} key - The highlight key.
	 */
	show (key: string) {
		if (!HIGHLIGHTS_MAP[key] || !Storage.getHighlight(key)) {
			return;
		};

		HIGHLIGHTS_MAP[key].forEach(item => this.add($(item)));
	};

	/**
	 * Hides highlight for a specific key and updates storage.
	 * @param {string} key - The highlight key.
	 */
	hide (key: string) {
		Storage.setHighlight(key, false);

		if (HIGHLIGHTS_MAP[key]) {
			HIGHLIGHTS_MAP[key].forEach(item => { this.remove($(item)); });
		};
	};

	/**
	 * Adds a highlight mark to a node.
	 * @param {JQuery<HTMLElement>} node - The node to add the highlight to.
	 */
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

	/**
	 * Removes a highlight mark from a node.
	 * @param {JQuery<HTMLElement>} node - The node to remove the highlight from.
	 */
	remove (node) {
		if (!node || !node.length) {
			return;
		};

		node.find('.highlightMark').remove();
	};

};

export default new Highlight();
