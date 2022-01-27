import { observable, action, computed, set, makeObservable } from 'mobx';
import { I, Storage, Util } from 'ts/lib';
import { analytics } from 'ts/lib';

const Constant = require('json/constant.json');

interface Preview {
	type: I.MarkType,
	param: string;
	object: any;
	element: any;
	range: I.TextRange;
	marks: I.Mark[];
	noUnlink?: boolean;
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

interface Sidebar {
	x: number;
	y: number;
	width: number;
	height: number;
	fixed: boolean;
	snap: I.MenuDirection;
};

const $ = require('jquery');
const { ipcRenderer } = window.require('electron');

class CommonStore {

    public coverObj: Cover = { id: '', type: 0, image: '' };
    public coverImg: string = '';
    public progressObj: I.Progress = null;
    public filterObj: Filter = { from: 0, text: '' };
    public gatewayUrl: string = '';
    public previewObj: Preview = { type: 0, param: '', object: null, element: null, range: { from: 0, to: 0 }, marks: [] };
    public configObj: any = {};
    public cellId: string = '';
	public themeId: string = '';
	public typeId: string = '';
	public pinTimeId: number = 0;
	public sidebarObj: Sidebar = { width: 0, height: 0, x: 0, y: 0, fixed: false, snap: I.MenuDirection.Left };

    constructor() {
        makeObservable(this, {
            coverObj: observable,
			sidebarObj: observable,
            coverImg: observable,
            progressObj: observable,
            filterObj: observable,
            gatewayUrl: observable,
            previewObj: observable,
            configObj: observable,
			themeId: observable,
			typeId: observable,
            config: computed,
            progress: computed,
            preview: computed,
            filter: computed,
            cover: computed,
            coverImage: computed,
            gateway: computed,
			theme: computed,
			sidebar: computed,
            coverSet: action,
            coverSetUploadedImage: action,
            gatewaySet: action,
            progressSet: action,
            progressClear: action,
            filterSetFrom: action,
            filterSetText: action,
            filterSet: action,
            previewSet: action,
			themeSet: action,
			sidebarSet: action,
        });
    };

    get config(): any {
		return { ...this.configObj, debug: this.configObj.debug || {} };
	};

    get progress(): I.Progress {
		return this.progressObj;
	};

    get preview(): Preview {
		return this.previewObj;
	};

    get filter(): Filter {
		return this.filterObj;
	};

    get cover(): Cover {
		return this.coverObj;
	};

    get coverImage(): string {
		return this.coverImg;
	};

    get gateway(): string {
		return String(this.gatewayUrl || '');
	};

	get type(): string {
		return String(this.typeId || Constant.typeId.page);
	};

	get pinTime(): number {
		return (Number(this.pinTimeId) || Constant.default.pinTime) * 1000;
	};

	get theme(): string {
		return String(this.themeId || '');
	};

	get sidebar(): Sidebar {
		return this.sidebarObj;
	};

    coverSet (id: string, image: string, type: I.CoverType) {
		this.coverObj = { id, image, type };
		Storage.set('cover', this.coverObj);

		if (type == I.CoverType.Upload) {
			this.coverSetUploadedImage(image);
		};
	};

    coverSetUploadedImage (image: string) {
		this.coverImg = image;
		Storage.set('coverImg', this.coverImg);
	};

    coverSetDefault () {
		this.coverSet('c' + Constant.default.cover, '', I.CoverType.Image);
	};

    gatewaySet (v: string) {
		this.gatewayUrl = v;
	};

    fileUrl (hash: string) {
		hash = String(hash || '');
		return this.gateway + '/file/' + hash;
	};

    imageUrl (hash: string, width: number) {
		hash = String(hash || '');
		width = Number(width) || 0;
		return this.gateway + '/image/' + hash + '?width=' + width;
	};

    progressSet (v: I.Progress) {
		this.progressObj = v;
	};

    progressClear () {
		this.progressObj = null;
	};

    filterSetFrom (from: number) {
		this.filterObj.from = from;
	};

    filterSetText (text: string) {
		this.filterObj.text = Util.filterFix(text);
	};

    filterSet (from: number, text: string) {
		this.filterSetFrom(from);
		this.filterSetText(text);
	};

    previewSet (preview: Preview) {
		this.previewObj = preview;
	};

	previewClear () {
		this.previewObj = { type: 0, param: '', object: null, element: null, range: { from: 0, to: 0 }, marks: [] };
	};

	defaultTypeSet (v: string) {
		this.typeId = v;
		Storage.set('defaultType', v);
	};

	pinTimeSet (v: string) {
		this.pinTimeId = Number(v) || Constant.default.pinTime;
		Storage.set('pinTime', v);
	};

	themeSet (v: string) {
		this.themeId = v;
		Storage.set('theme', v);
		Util.addBodyClass('theme', v);

		ipcRenderer.send('configSet', { theme: v });
		analytics.event('ThemeSet', { id: v });
	};

	sidebarSet (v: any) {
		const win = $(window);
		const size = Constant.size.sidebar;

		v = Object.assign(this.sidebarObj, v);
		v.fixed = Boolean(v.fixed);
		
		v.width = Number(v.width) || 0;
		v.width = Math.max(size.width.min, Math.min(size.width.max, v.width));
		
		v.height = Number(v.height) || 0;
		v.height = Math.max(size.height.min, Math.min(win.height() - Util.sizeHeader(), v.height));

		set(this.sidebarObj, v);
		Storage.set('sidebar', v);
	};

	configSet (config: any, force: boolean) {
		console.log('[commonStore.configSet]', JSON.stringify(config, null, 3), force);

		let obj = $('html');
		let newConfig: any = {};

		if (force) {
			newConfig = config;
		} else {
			for (let k in config) {
				if (undefined === this.configObj[k]) {
					newConfig[k] = config[k];
				};
			};
		};

		set(this.configObj, newConfig);

		this.configObj.debug = this.configObj.debug || {};
		this.configObj.debug.ui ? obj.addClass('debug') : obj.removeClass('debug');
	};

};

export let commonStore: CommonStore = new CommonStore();