import { observable, action, computed, set, makeObservable } from 'mobx';
import { I, Storage, Util, DataUtil } from 'ts/lib';

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

const Constant = require('json/constant.json');
const $ = require('jquery');

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
	public nativeThemeIsDark: boolean = false;
	public typeId: string = '';
	public pinTimeId: number = 0;
	public sidebarObj: Sidebar = { width: 0, height: 0, x: 0, y: 0, fixed: false, snap: I.MenuDirection.Left };
	public sidebarOldFixed: boolean = false;
	public isFullScreen: boolean = false;
	public autoSidebarValue: boolean = false;
	public timezoneValue: string = 'gmt';

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
			nativeThemeIsDark: observable,
			typeId: observable,
			isFullScreen: observable,
			timezoneValue: observable,
            config: computed,
            progress: computed,
            preview: computed,
            filter: computed,
            cover: computed,
            coverImage: computed,
            gateway: computed,
			theme: computed,
			nativeTheme: computed,
			sidebar: computed,
			timezone: computed,
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
			nativeThemeSet: action,
			sidebarSet: action,
        });
    };

    get config(): any {
		return window.Config || { ...this.configObj, debug: this.configObj.debug || {} };
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

	get fullscreen(): boolean {
		return this.isFullScreen;
	};

	get pinTime(): number {
		return (Number(this.pinTimeId) || Constant.default.pinTime) * 1000;
	};

	get autoSidebar(): boolean {
		return Boolean(this.autoSidebarValue);
	};

	get theme(): string {
		return String(this.themeId || '');
	};

	get nativeTheme(): string {
		return this.nativeThemeIsDark ? 'dark' : '';
	};

	get sidebar(): Sidebar {
		return this.sidebarObj;
	};

	get timezone(): string {
		return String(this.timezoneValue || 'gmt');
	};

	timezoneSet (v: string) {
		this.timezoneValue = String(v || '');
		Storage.set('timezone', this.timezoneValue);
	};

	timezoneGet () {
		return DataUtil.timezones().find(it => it.id == this.timezone);
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
		const cover = this.coverGetDefault();
		this.coverSet(cover.id, '', cover.type);
	};

	coverGetDefault () {
		return { id: Constant.default.cover, type: I.CoverType.Gradient };
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
		return `${this.gateway}/image/${hash}?width=${width}`;
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
		this.typeId = String(v || '');
		Storage.set('defaultType', this.typeId);
	};

	pinTimeSet (v: string) {
		this.pinTimeId = Number(v) || Constant.default.pinTime;
		Storage.set('pinTime', this.pinTimeId);
	};

	autoSidebarSet (v: boolean) {
		this.autoSidebarValue = Boolean(v);
		Storage.set('autoSidebar', this.autoSidebarValue);
	};

	fullscreenSet (v: boolean) {
		const body = $('body');
		
		this.isFullScreen = v;
		v ? body.addClass('isFullScreen') : body.removeClass('isFullScreen');
	};

	themeSet (v: string) {
		this.themeId = v;
		Storage.set('theme', v);
		
		this.setThemeClass();
	};

	getThemeClass () {
		if (this.themeId == 'system') {
			return this.nativeThemeIsDark ? 'dark' : '';
		} else {
			return this.themeId;
		};
	};

	setThemeClass() {
		Util.addBodyClass('theme', this.getThemeClass());
	};

	nativeThemeSet (isDark: boolean) {
		console.log('[nativeThemeSet]', isDark);
		this.nativeThemeIsDark = isDark;
	};

	sidebarInit () {
		const stored = Storage.get('sidebar');
		if (stored) {
			this.sidebarSet(stored);
			return;
		};

		const platform = Util.getPlatform();
		const isWindows = platform == I.Platform.Windows;
		const offset = isWindows ? 30 : 0;
		const win = $(window);
		const wh = win.height();
		const height = this.sidebarMaxHeight();
		const y = (wh - offset) / 2 - height / 2 + offset;

		Storage.setToggle(Constant.subIds.sidebar, 'favorite', true);
		Storage.setToggle(Constant.subIds.sidebar, 'recent', true);
		Storage.setToggle(Constant.subIds.sidebar, 'set', true);

		this.sidebarSet({
			height,
			y,
			x: 0,
			fixed: true,
			snap: I.MenuDirection.Left,
		});

		this.sidebarOldFixed = false;
		this.autoSidebarSet(true);
	};

	sidebarSet (v: any) {
		const size = Constant.size.sidebar;

		v = Object.assign(this.sidebarObj, v);
		v.fixed = Boolean(v.fixed);
		
		v.width = Number(v.width) || 0;
		v.width = Math.max(size.width.min, Math.min(size.width.max, v.width));
		
		v.height = Number(v.height) || 0;
		v.height = Math.max(size.height.min, Math.min(this.sidebarMaxHeight(), v.height));

		set(this.sidebarObj, v);
		Storage.set('sidebar', v);
	};

	sidebarMaxHeight () {
		const win = $(window);
		const wh = win.height() - Util.sizeHeader();
		return wh - 144;
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