import { observable, action, computed, set } from 'mobx';
import { I, Storage, Util, analytics } from 'ts/lib';
import { getEmojiDataFromNative } from 'emoji-mart';

const EmojiData = require('emoji-mart/data/apple.json');
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

class CommonStore {
	@observable public popupList: I.Popup[] = [];
	@observable public menuList: I.Menu[] = [];
	@observable public coverNum: number = 0;
	@observable public coverImage: string = '';
	@observable public progressObj: I.Progress = {};
	@observable public filterObj: Filter = { from: 0, text: '' };
	@observable public gatewayUrl: string = '';
	@observable public linkPreviewObj: LinkPreview;
	public smileCache: any = {};
	
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
	get coverId(): number {
		return Number(this.coverNum || Storage.get('coverNum')) || 0;
	};
	
	@computed
	get coverImg(): string {
		return String(this.coverImage || Storage.get('coverImage') || '');
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
	coverSetNum (num: number) {
		this.coverNum = num;
		Storage.set('coverNum', this.coverNum);
	};
	
	@action
	coverSetImage (image: string) {
		this.coverImage = image;
		Storage.set('coverImage', this.coverImage);
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
		this.progressObj = {};
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
		let item = this.popupList.find((item: I.Popup) => { return item.id == id; });
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
		const dimmer = $('#dimmer');
		
		if (el.length) {
			el.css({ transform: '' }).removeClass('show');
		};
		
		if (dimmer.length && (this.popupList.length == 1)) {
			dimmer.removeClass('show');
		};
		
		window.setTimeout(() => {
			this.popupList = this.popupList.filter((item: I.Popup) => { return item.id != id; });
			
			if (callBack) {
				callBack();
			};
		}, Constant.delay.menu);
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
		});
		
		analytics.event(Util.toCamelCase('Menu-' + id));
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
		
		if (item.param.onClose) {
			item.param.onClose();
		};
		
		const el = $('#' + Util.toCamelCase('menu-' + id));
		if (el.length) {
			el.css({ transform: '' }).removeClass('show');
		};
		
		window.setTimeout(() => {
			this.menuList = this.menuList.filter((item: I.Menu) => { return item.id != id; });
			
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

	smileGet (icon: string) {
		if (this.smileCache[icon]) {
			return this.smileCache[icon];
		};

		this.smileCache[icon] = getEmojiDataFromNative(icon, 'apple', EmojiData);
		return this.smileCache[icon];
	};
	
};

export let commonStore: CommonStore = new CommonStore();