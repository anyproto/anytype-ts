import { observable, action, computed, set, makeObservable } from 'mobx';
import $ from 'jquery';
import { I, U, J, Preview } from 'Lib';

class MenuStore {

	public menuList: I.Menu[] = [];

	timeout = 0;
	isAnimatingFlag: Map<string, boolean> = new Map();

	constructor () {
		makeObservable(this, {
			menuList: observable,
			list: computed,
			open: action,
			update: action,
			updateData: action,
			close: action,
			closeAll: action
		});
	};

	get list(): I.Menu[] {
		return this.menuList;
	};

	/**
	 * Opens a menu with the given ID and parameters.
	 * @param {string} id - The menu ID.
	 * @param {I.MenuParam} param - The menu parameters.
	 */
	open (id: string, param: I.MenuParam) {
		if (!id) {
			return;
		};

		param = this.normaliseParam(param);

		const item = this.get(id);
		if (item) {
			this.update(id, param);
		} else {
			this.menuList.push({ id, param });
		};

		Preview.previewHide(true);
	};

	/**
	 * Normalises menu parameters, setting defaults as needed.
	 * @private
	 * @param {I.MenuParam} param - The menu parameters.
	 * @returns {I.MenuParam} The normalised parameters.
	 */
	normaliseParam (param: I.MenuParam) {
		param.type = Number(param.type) || I.MenuType.Vertical;
		param.vertical = Number(param.vertical) || I.MenuDirection.Bottom;
		param.horizontal = Number(param.horizontal) || I.MenuDirection.Left;
		param.data = param.data || {};

		if (param.isSub) {
			param.noAnimation = 'undefined' == typeof(param.noAnimation) ? true : param.noAnimation;
			param.passThrough = 'undefined' == typeof(param.passThrough) ? true : param.passThrough;
		};

		return param;
	};

	/**
	 * Updates a menu with the given ID and parameters.
	 * @param {string} id - The menu ID.
	 * @param {any} param - The menu parameters.
	 */
	update (id: string, param: any) {
		const item = this.get(id);
		if (item) {
			param.data = Object.assign(item.param.data, param.data);
			set(item, { param: Object.assign(item.param, param) });
		};
	};

	/**
	 * Updates the data of a menu with the given ID.
	 * @param {string} id - The menu ID.
	 * @param {any} data - The new data.
	 */
	updateData (id: string, data: any) {
		const item = this.get(id);
		if (item) {
			set(item.param.data, data);
		};
	};

	/**
	 * Replaces a menu with a new ID and parameters.
	 * @param {string} oldId - The old menu ID.
	 * @param {string} newId - The new menu ID.
	 * @param {I.MenuParam} param - The menu parameters.
	 */
	replace (oldId: string, newId: string, param: I.MenuParam) {
		const idx = this.menuList.findIndex(it => it.id == oldId);
		if (idx >= 0) {
			set(this.menuList[idx], { id: newId, param });
		} else {
			this.menuList.push({ id: newId, param });
		};
	};

	/**
	 * Gets a menu by ID.
	 * @param {string} id - The menu ID.
	 * @returns {I.Menu} The menu object.
	 */
	get (id: string): I.Menu {
		return this.menuList.find(it => it.id == id);
	};

	/**
	 * Checks if a menu is open.
	 * @param {string} [id] - The menu ID.
	 * @param {string} [key] - The menu key.
	 * @param {string[]} [filter] - Filter for menu IDs.
	 * @returns {boolean} True if open, false otherwise.
	 */
	isOpen (id?: string, key?: string, filter?: string[]): boolean {
		if (!id) {
			let length = 0;
			if (filter) {
				length = this.menuList.filter(it => filter ? !filter.includes(it.id) && !filter.includes(it.param.component) : true).length;
			} else {
				length = this.menuList.length;
			};
			return length > 0;
		};

		const item = this.get(id);
		if (!item) {
			return false;
		};

		return key ? (item.param.menuKey == key) : true;
	};

	/**
	 * Checks if any menu in a list of IDs is open.
	 * @private
	 * @param {string[]} ids - The menu IDs.
	 * @returns {boolean} True if any menu is open, false otherwise.
	 */
	isOpenList (ids: string[]) {
		for (const id of ids) {
			if (this.isOpen(id)) {
				return true;
			};
		};
		return false;
	};

	/**
	 * Closes a menu by ID.
	 * @param {string} id - The menu ID.
	 * @param {() => void} [callBack] - Optional callback after close.
	 */
	close (id: string, callBack?: () => void) {
		const item = this.get(id);
		if (!item) {
			if (callBack) {
				callBack();
			};
			return;
		};

		const { param } = item;
		const { noAnimation, subIds, onClose } = param;
		const t = noAnimation ? 0 : J.Constant.delay.menu;
		const el = $(`#${U.Common.toCamelCase(`menu-${id}`)}`);

		if (subIds && subIds.length) {
			this.closeAll(subIds);
		};

		if (el.length) {
			el.toggleClass('noAnimation', noAnimation);
			el.css({ transform: '' }).removeClass('show');
		};

		const onTimeout = () => {
			this.menuList = this.menuList.filter(it => it.id != id);

			if (onClose) {
				onClose();
			};

			if (callBack) {
				callBack();
			};

			this.setIsAnimating(id, false);
		};

		if (t) {
			this.setIsAnimating(id, true);
			window.setTimeout(onTimeout, t);
		} else {
			onTimeout();
		};
	};

	/**
	 * Sets the animating flag for a menu ID.
	 * @private
	 * @param {string} id - The menu ID.
	 * @param {boolean} v - The animating value.
	 */
	setIsAnimating (id: string, v: boolean) {
		this.isAnimatingFlag.set(id, v);
	};

	/**
	 * Checks if a menu is animating.
	 * @private
	 * @param {string} id - The menu ID.
	 * @returns {boolean} True if animating, false otherwise.
	 */
	isAnimating (id: string): boolean {
		return !!this.isAnimatingFlag.get(id);
	};

	/**
	 * Closes all menus, optionally filtered by IDs.
	 * @param {string[]} [ids] - Menu IDs to close.
	 * @param {() => void} [callBack] - Optional callback after close.
	 */
	closeAll (ids?: string[], callBack?: () => void) {
		const items = this.getItems(ids);
		if (!items.length) {
			if (callBack) {
				callBack();
			};
			return;
		};
		
		const timeout = this.getTimeout(ids);

		items.filter(it => !it.param.noClose).forEach(it => this.close(it.id));
		this.onCloseAll(timeout, callBack);
	};

	/**
	 * Closes all menus forcibly, optionally filtered by IDs.
	 * @private
	 * @param {string[]} [ids] - Menu IDs to close.
	 * @param {() => void} [callBack] - Optional callback after close.
	 */
	closeAllForced (ids?: string[], callBack?: () => void) {
		const items = this.getItems(ids);
		const timeout = this.getTimeout(ids);

		items.forEach(it => this.close(it.id));
		this.onCloseAll(timeout, callBack);
	};

	/**
	 * Handles the callback after closing all menus with a timeout.
	 * @private
	 * @param {number} timeout - The timeout duration.
	 * @param {() => void} [callBack] - Optional callback after close.
	 */
	onCloseAll (timeout: number, callBack?: () => void) {
		if (!callBack) {
			return;
		};

		this.clearTimeout();
		this.timeout = window.setTimeout(() => callBack(), timeout);
	};

	/**
	 * Gets the timeout value for a set of menu IDs.
	 * @private
	 * @param {string[]} [ids] - Menu IDs.
	 * @returns {number} The timeout value.
	 */
	getTimeout (ids?: string[]): number {
		const items = this.getItems(ids);

		let t = 0;
		for (const item of items) {
			if (!item.param.noAnimation) {
				t = J.Constant.delay.menu;
				break;
			};
		};
		return t;
	};

	/**
	 * Gets the menu items, optionally filtered by IDs.
	 * @private
	 * @param {string[]} [ids] - Menu IDs.
	 * @returns {I.Menu[]} The menu items.
	 */
	getItems (ids?: string[]) {
		return ids && ids.length ? this.menuList.filter(it => ids.includes(it.id)) : this.menuList;
	};

	/**
	 * Closes the last open menu.
	 * @private
	 */
	closeLast () {
		const items = this.getItems(null).filter(it => !it.param.noClose);
		if (items.length) {
			this.close(items[items.length - 1].id);
		};
	};

	/**
	 * Clears the menu close timeout.
	 * @private
	 */
	clearTimeout () {
		window.clearTimeout(this.timeout);
	};

	/**
	 * Checks if a menu with a given key is open.
	 * @private
	 * @param {string} key - The menu key.
	 * @returns {boolean} True if open, false otherwise.
	 */
	checkKey (key: string) {
		return this.menuList.find(it => it.param.menuKey == key) ? true : false;
	};

	/**
	 * Triggers resize events for all open menus.
	 * @private
	 */
	resizeAll () {
		const win = $(window);
		this.list.forEach(it => win.trigger(`resize.${U.Common.toCamelCase(`menu-${it.id}`)}`));
	};

};

export const Menu: MenuStore = new MenuStore();
