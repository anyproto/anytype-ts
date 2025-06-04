import { U } from 'Lib';

class History {

	list: string[] = [];
	index = 0;

	/**
	 * Clears the history list and resets the index.
	 */
	clear () {
		this.list = [];
		this.index = 0;
	};

	/**
	 * Pushes a new route to the history list.
	 * @param {string} route - The route to push.
	 */
	push (route: string) {
		const last = this.list[this.list.length - 1];
		if (last && (last == route)) {
			this.index = this.list.length - 1;
			return;
		};

		if (this.index < this.list.length - 1) {
			this.list = this.list.slice(0, this.index + 1);
		};

		this.list.push(route);
		this.index = this.list.length - 1;
	};

	/**
	 * Pushes a match object as a route to the history list.
	 * @param {any} match - The match object.
	 */
	pushMatch (match: any) {
		this.push(this.build(match));
	};

	/**
	 * Builds a route string from a match object.
	 * @param {any} match - The match object.
	 * @returns {string} The route string.
	 */
	build (match: any): string {
		return [ match.params.page, match.params.action, match.params.id ].join('/');
	};

	/**
	 * Checks if there is a previous route in history.
	 * @returns {boolean} True if back is possible.
	 */
	checkBack () {
		return this.index - 1 >= 0;
	};

	/**
	 * Checks if there is a next route in history.
	 * @returns {boolean} True if forward is possible.
	 */
	checkForward () {
		return this.index + 1 <= this.list.length - 1;
	};

	/**
	 * Navigates to a route and calls the callback with match params.
	 * @param {string} route - The route to go to.
	 * @param {function} callBack - The callback with match params.
	 */
	go (route: string, callBack: (match: any) => void) {
		callBack({ route, params: U.Router.getParam(route) });
	};

	/**
	 * Navigates back in history and calls the callback.
	 * @param {function} callBack - The callback with match params.
	 */
	goBack (callBack: (match: any) => void) {
		if (this.checkBack()) {
			this.index--;
			this.go(this.list[this.index], callBack);
		};
	};

	/**
	 * Navigates forward in history and calls the callback.
	 * @param {function} callBack - The callback with match params.
	 */
	goForward (callBack: (match: any) => void) {
		if (this.checkForward()) {
			this.index++;
			this.go(this.list[this.index], callBack);
		};
	};

};

 export const history: History = new History();