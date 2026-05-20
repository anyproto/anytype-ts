import Storage from 'Lib/storage';

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

		HIGHLIGHTS_MAP[key].forEach(item => this.add(U.Dom.select(item)));
	};

	/**
	 * Hides highlight for a specific key and updates storage.
	 * @param {string} key - The highlight key.
	 */
	hide (key: string) {
		Storage.setHighlight(key, false);

		if (HIGHLIGHTS_MAP[key]) {
			HIGHLIGHTS_MAP[key].forEach(item => this.remove(U.Dom.select(item)));
		};
	};

	/**
	 * Adds a highlight mark to a node.
	 * @param {HTMLElement} node - The node to add the highlight to.
	 */
	add (node: HTMLElement) {
		if (!node) {
			return;
		};

		if (U.Dom.select('.highlightMark', node)) {
			return;
		};

		const dot = document.createElement('div');
		dot.className = 'highlightMark';
		node.appendChild(dot);
	};

	/**
	 * Removes a highlight mark from a node.
	 * @param {HTMLElement} node - The node to remove the highlight from.
	 */
	remove (node: HTMLElement) {
		if (!node) {
			return;
		};

		const mark = U.Dom.select('.highlightMark', node);
		if (mark) {
			mark.remove();
		};
	};

};

export default new Highlight();
