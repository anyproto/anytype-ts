import { observable, action, computed, set } from 'mobx';
import { I, Storage, Util, analytics } from 'ts/lib';

const Constant = require('json/constant.json');
const $ = require('jquery');

interface LinkPreview {
	url: string;
	element: any;
	rootId: string;
	blockId: string;
	range: I.TextRange;
	marks: I.Mark[];
	onChange?(marks: I.Mark[]): void;
};

interface Filter {
	from: number;
	text: string;
};

interface Cover {
	id: string;
	image: string;
	type: I.CoverType;
};

class CommonStore {
	@observable public popupList: I.Popup[] = [];
	@observable public menuList: I.Menu[] = [];
	@observable public coverObj: Cover = { id: '', type: 0, image: '' };
	@observable public coverImg: string = '';
	@observable public progressObj: I.Progress = null;
	@observable public filterObj: Filter = { from: 0, text: '' };
	@observable public gatewayUrl: string = '';
	@observable public linkPreviewObj: LinkPreview;
	public config:any = {};
	
	@computed
	get progress(): I.Progress {
		return this.progressObj;
	};
	
	@computed
	get linkPreview(): LinkPreview {
		return this.linkPreviewObj;
	};
	
	@computed
	get filter(): Filter {
		return this.filterObj;
	};
	
	@computed
	get cover(): Cover {
		return this.coverObj;
	};

	@computed
	get coverImage(): Cover {
		return this.coverImg || Storage.get('coverImg');
	};
	
	@computed
	get popups(): I.Popup[] {
		return this.popupList;
	};
	
	@computed
	get menus(): I.Menu[] {
		return this.menuList;
	};
	
	@computed
	get gateway(): string {
		return String(this.gatewayUrl || Storage.get('gateway') || '');
	};
	
	@action
	coverSet (id: string, image: string, type: I.CoverType) {
		this.coverObj = { id: id, image: image, type: type };
		Storage.set('cover', this.coverObj);
	};

	@action
	coverSetUploadedImage (image: string) {
		this.coverImg = image;
		Storage.set('coverImg', this.coverImg);
	};

	coverSetDefault () {
		this.coverSet('c' + Constant.default.cover, '', I.CoverType.BgImage);
	};
	
	@action
	gatewaySet (v: string) {
		this.gatewayUrl = v;
		Storage.set('gateway', v);
	};
	
	fileUrl (hash: string) {
		return this.gateway + '/file/' + hash;
	};
	
	imageUrl (hash: string, width: number) {
		return this.gateway + '/image/' + hash + '?width=' + width;
	};
	
	@action
	progressSet (v: I.Progress) {
		this.progressObj = v;
	};
	
	@action
	progressClear () {
		this.progressObj = null;
	};
	
	@action
	popupOpen (id: string, param: I.PopupParam) {
		this.popupClose(id, () => {
			this.popupList.push({ id: id, param: param });
		});
		
		analytics.event(Util.toCamelCase('Popup-' + id));
		this.menuCloseAll();
	};
	
	@action
	popupUpdate (id: string, param: any) {
		const item = this.popupList.find((item: I.Popup) => { return item.id == id; });
		if (!item) {
			return;
		};
		
		set(item, { param: param });
	};
	
	popupIsOpen (id?: string): boolean {
		if (!id) {
			return this.popupList.length > 0;
		};
		return this.popupList.find((item: I.Popup) => { return item.id == id; }) ? true : false;
	};
	
	@action
	popupClose (id: string, callBack?: () => void) {
		const item: I.Popup = this.popupList.find((item: I.Popup) => { return item.id == id; });
		
		if (!item) {
			if (callBack) {
				callBack();
			};
			return;
		};
		
		if (item.param.onClose) {
			item.param.onClose();
		};
		
		const el = $('#' + Util.toCamelCase('popup-' + id));
		
		if (el.length) {
			el.css({ transform: '' }).removeClass('show');
		};
		
		window.setTimeout(() => {
			this.popupList = this.popupList.filter((item: I.Popup) => { return item.id != id; });
			
			if (callBack) {
				callBack();
			};
		}, Constant.delay.popup);
	};
	
	@action
	popupCloseAll () {
		for (let item of this.popupList) {
			this.popupClose(item.id);
		};
	};
	
	@action
	menuOpen (id: string, param: I.MenuParam) {
		param.offsetX = Number(param.offsetX) || 0;
		param.offsetY = Number(param.offsetY) || 0;
		
		if (!param.element) {
			console.error('[menuOpen] Element is not defined');
			return;
		};

		this.menuClose(id, () => {
			this.menuList.push({ id: id, param: param });
			
			if (param.onOpen) {
				param.onOpen();
			};
		});
		
		analytics.event(Util.toCamelCase('Menu-' + id));
	};

	@action
	menuUpdate (id: string, param: any) {
		const item = this.menuList.find((item: I.Menu) => { return item.id == id; });
		if (!item) {
			return;
		};

		param = Object.assign(item.param, param);
		console.log(param);
		set(item, param);
	};
	
	menuIsOpen (id?: string): boolean {
		if (!id) {
			return this.menuList.length > 0;
		};
		return this.menuList.find((item: I.Menu) => { return item.id == id; }) ? true : false;
	};
	
	@action
	menuClose (id: string, callBack?: () => void) {
		const item: I.Menu = this.menuList.find((item: I.Menu) => { return item.id == id; });

		if (!item) {
			if (callBack) {
				callBack();
			};
			return;
		};
		
		const el = $('#' + Util.toCamelCase('menu-' + id));
		if (el.length) {
			el.css({ transform: '' }).removeClass('show');
		};
		
		window.setTimeout(() => {
			this.menuList = this.menuList.filter((item: I.Menu) => { return item.id != id; });
			
			if (item.param.onClose) {
				item.param.onClose();
			};
			
			if (callBack) {
				callBack();
			};
		}, Constant.delay.menu);
	};
	
	@action
	menuCloseAll () {
		for (let item of this.menuList) {
			this.menuClose(item.id);
		};
	};
	
	@action
	filterSetFrom (from: number) {
		this.filterObj.from = from;
	};

	@action
	filterSetText (text: string) {
		this.filterObj.text = Util.filterFix(text);
	};

	@action
	filterSet (from: number, text: string) {
		this.filterSetFrom(from);
		this.filterSetText(text);
	};

	@action
	linkPreviewSet (param: LinkPreview) {
		this.linkPreviewObj = param;
	};

	configSet (config: any) {
		this.config = config;
	};
	
};

export let commonStore: CommonStore = new CommonStore();