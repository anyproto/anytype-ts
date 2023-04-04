import { observable, action, computed, set, makeObservable } from 'mobx';
import $ from 'jquery';
import { I, Util } from 'Lib';
import Constant from 'json/constant.json';


class MenuStore {

    public menuList: I.Menu[] = [];

    timeout = 0;

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

		param.type = Number(param.type) || I.MenuType.Vertical;
		param.vertical = Number(param.vertical) || I.MenuDirection.Bottom;
		param.horizontal = Number(param.horizontal) || I.MenuDirection.Left;
		param.data = param.data || {};

		if (param.isSub) {
			param.noAnimation = true;
			param.passThrough = true;
		};

		const item = this.get(id);
		if (item) {
			this.update(id, param);
		} else {
			this.menuList.push({ id: id, param: param });
		};
	};

    update (id: string, param: any) {
		const item = this.get(id);

		if (item) {
			set(item, { param: Object.assign(item.param, param) });
		};
	};

    updateData (id: string, data: any) {
		const item = this.get(id);
		if (item) {
			set(item.param.data, data);
		};
	};

    get (id: string): I.Menu {
		return this.menuList.find(it => it.id == id);
	};

    isOpen (id?: string, key?: string): boolean {
		if (!id) {
			return this.menuList.length > 0;
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
		const el = $('#' + Util.toCamelCase('menu-' + id));

		if (subIds && subIds.length) {
			this.closeAll(subIds);
		};

		if (el.length) {
			if (noAnimation) {
				el.addClass('noAnimation');
			};
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
		};

		if (t) {
			window.setTimeout(onTimeout, t);
		} else {
			onTimeout();
		};
	};

    closeAll (ids?: string[], callBack?: () => void) {
		const items = ids && ids.length ? this.menuList.filter(it => ids.includes(it.id)) : this.menuList;

		items.forEach(it => this.close(it.id));

		this.clearTimeout();
		if (callBack) {
			this.timeout = window.setTimeout(() => { callBack(); }, Constant.delay.menu);
		};
	};

	closeLast () {
		if (this.menuList.length) {
			this.close(this.menuList[this.menuList.length - 1].id);
		};
	};

    clearTimeout () {
		window.clearTimeout(this.timeout);
	};

	checkKey (key: string) {
		return this.menuList.find(it => it.param.menuKey == key) ? true : false;
	};

};

 export const menuStore: MenuStore = new MenuStore();