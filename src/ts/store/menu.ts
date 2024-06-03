import { observable, action, computed, set, makeObservable } from 'mobx';
import $ from 'jquery';
import { I, UtilCommon, Preview } from 'Lib';
const Constant = require('json/constant.json');

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

    update (id: string, param: any) {
		const item = this.get(id);

		if (item) {
			param.data = Object.assign(item.param.data, param.data);
			set(item, { param: Object.assign(item.param, param) });
		};
	};

    updateData (id: string, data: any) {
		const item = this.get(id);
		if (item) {
			set(item.param.data, data);
		};
	};

	replace (oldId: string, newId: string, param: I.MenuParam) {
		const idx = this.menuList.findIndex(it => it.id == oldId);
		if (idx >= 0) {
			set(this.menuList[idx], { id: newId, param });
		} else {
			this.menuList.push({ id: newId, param });
		};
	};

    get (id: string): I.Menu {
		return this.menuList.find(it => it.id == id);
	};

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

    isOpenList (ids: string[]) {
		for (const id of ids) {
			if (this.isOpen(id)) {
				return true;
			};
		};
		return false;
	};

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
		const t = noAnimation ? 0 : Constant.delay.menu;
		const el = $(`#${UtilCommon.toCamelCase(`menu-${id}`)}`);

		if (subIds && subIds.length) {
			this.closeAll(subIds);
		};

		if (el.length) {
			noAnimation ? el.addClass('noAnimation') : el.removeClass('noAnimation');
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

	setIsAnimating (id: string, v: boolean) {
		this.isAnimatingFlag.set(id, v);
	};

	isAnimating (id: string): boolean {
		return !!this.isAnimatingFlag.get(id);
	};

    closeAll (ids?: string[], callBack?: () => void) {
		const items = this.getItems(ids);
		const timeout = this.getTimeout();

		items.filter(it => !it.param.noClose).forEach(it => this.close(it.id));
		this.onCloseAll(timeout, callBack);
	};

	closeAllForced (ids?: string[], callBack?: () => void) {
		const items = this.getItems(ids);
		const timeout = this.getTimeout();

		items.forEach(it => this.close(it.id));
		this.onCloseAll(timeout, callBack);
	};

	onCloseAll (timeout: number, callBack?: () => void) {
		if (callBack) {
			this.clearTimeout();
			this.timeout = window.setTimeout(() => callBack(), timeout);
		};
	};

	getTimeout (): number {
		const items = this.getItems();

		let t = 0;
		for (const item of items) {
			if (!item.param.noAnimation) {
				t = Constant.delay.menu;
			};
		};
		return t;
	};

	getItems (ids?: string[]) {
		return ids && ids.length ? this.menuList.filter(it => ids.includes(it.id)) : this.menuList;
	};

	closeLast () {
		const items = this.getItems(null).filter(it => !it.param.noClose);
		if (items.length) {
			this.close(items[items.length - 1].id);
		};
	};

    clearTimeout () {
		window.clearTimeout(this.timeout);
	};

	checkKey (key: string) {
		return this.menuList.find(it => it.param.menuKey == key) ? true : false;
	};

	resizeAll () {
		const win = $(window);
		this.list.forEach(it => win.trigger(`resize.${UtilCommon.toCamelCase(`menu-${it.id}`)}`));
	};

};

 export const menuStore: MenuStore = new MenuStore();
