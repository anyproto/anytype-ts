import { action, computed, intercept, makeObservable, observable, set } from 'mobx';
import $ from 'jquery';
import { I, Storage, UtilCommon, UtilObject, Renderer } from 'Lib';
import { dbStore } from 'Store';
import Constant from 'json/constant.json';

interface Filter {
	from: number;
	text: string;
};

interface Graph {
	icon: boolean;
	orphan: boolean;
	marker: boolean;
	label: boolean;
	relation: boolean;
	link: boolean;
	local: boolean;
	filter: string;
};

interface SpaceStorage {
	bytesLimit: number;
	localUsage: number;
	spaces: {
		spaceId: string;
		bytesUsage: number;
	}[],
};

class CommonStore {

    public progressObj: I.Progress = null;
    public filterObj: Filter = { from: 0, text: '' };
    public gatewayUrl = '';
	public toastObj: I.Toast = null;
    public configObj: any = {};
    public cellId = '';
	public themeId = '';
	public nativeThemeIsDark = false;
	public defaultType = '';
	public pinTimeId = 0;
	public isFullScreen = false;
	public redirect = '';
	public languages: string[] = [];
	public spaceId = '';
	public notionToken = '';
	public autoSidebarValue = null;
	public isSidebarFixedValue = null;
	public showRelativeDatesValue = null;
	public fullscreenObjectValue = null;
	public gallery = {
		categories: [],
		list: [],
	};

	public previewObj: I.Preview = { 
		type: null, 
		target: null, 
		element: null, 
		range: { from: 0, to: 0 }, 
		marks: [],
	};

	public graphObj: Graph = { 
		icon: true,
		orphan: true,
		marker: true,
		label: true,
		relation: true,
		link: true,
		local: false,
		filter: '',
	};

	public spaceStorageObj: SpaceStorage = {
		bytesLimit: 0,
		localUsage: 0,
		spaces: [],
	};

    constructor() {
        makeObservable(this, {
            progressObj: observable,
            filterObj: observable,
            gatewayUrl: observable,
            previewObj: observable,
			toastObj: observable,
            configObj: observable,
			spaceStorageObj: observable,
			themeId: observable,
			nativeThemeIsDark: observable,
			defaultType: observable,
			isFullScreen: observable,
			autoSidebarValue: observable,
			isSidebarFixedValue: observable,
			fullscreenObjectValue: observable,
			spaceId: observable,
            config: computed,
            progress: computed,
            preview: computed,
			toast: computed,
            filter: computed,
            gateway: computed,
			theme: computed,
			nativeTheme: computed,
			space: computed,
            gatewaySet: action,
            progressSet: action,
            progressClear: action,
            filterSetFrom: action,
            filterSetText: action,
            filterSet: action,
            previewSet: action,
			toastSet: action,
			toastClear: action,
			themeSet: action,
			nativeThemeSet: action,
			spaceSet: action,
			spaceStorageSet: action,
		});

		intercept(this.configObj as any, change => UtilCommon.intercept(this.configObj, change));
    };

    get config(): any {
		const config = window.AnytypeGlobalConfig || this.configObj || {};
		return { ...config, debug: config.debug || {} };
	};

    get progress(): I.Progress {
		return this.progressObj;
	};

    get preview(): I.Preview {
		return this.previewObj;
	};

	get toast(): I.Toast {
		return this.toastObj;
	};

    get filter(): Filter {
		return this.filterObj;
	};

    get gateway(): string {
		return String(this.gatewayUrl || '');
	};

	get type(): string {
		const key = String(this.defaultType || Storage.get('defaultType') || Constant.default.typeKey);

		let type = dbStore.getTypeByKey(key);
		if (!type || !type.isInstalled || !UtilObject.getPageLayouts().includes(type.recommendedLayout)) {
			type = dbStore.getTypeByKey(Constant.default.typeKey);
		};

		return type ? type.id : '';
	};

	get fullscreen(): boolean {
		return this.isFullScreen;
	};

	get pinTime(): number {
		return (Number(this.pinTimeId) || Storage.get('pinTime') || Constant.default.pinTime) * 1000;
	};

	get autoSidebar(): boolean {
		return this.boolGet('autoSidebar');
	};

	get isSidebarFixed(): boolean {
		return this.boolGet('isSidebarFixed');
	};

	get fullscreenObject(): boolean {
		return this.boolGet('fullscreenObject');
	};

	get theme(): string {
		return String(this.themeId || '');
	};

	get nativeTheme(): string {
		return this.nativeThemeIsDark ? 'dark' : '';
	};

	get space(): string {
		return String(this.spaceId || '');
	};

	get graph(): Graph {
		return Object.assign(this.graphObj, Storage.get('graph') || {});
	};

	get spaceStorage (): SpaceStorage {
		const spaces = this.spaceStorageObj.spaces || [];
		return { ...this.spaceStorageObj, spaces };
	};

	get interfaceLang (): string {
		return this.config.interfaceLang || Constant.default.interfaceLang;
	};

	get showRelativeDates (): boolean {
		return this.boolGet('showRelativeDates');
	};

    gatewaySet (v: string) {
		this.gatewayUrl = v;
	};

    fileUrl (id: string) {
		return [ this.gateway, 'file', String(id || '') ].join('/');
	};

    imageUrl (id: string, width: number) {
		return [ this.gateway, 'image', String(id || '') ].join('/') + `?width=${Number(width) || 0}`;
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
		this.filterObj.text = text;
	};

    filterSet (from: number, text: string) {
		this.filterSetFrom(from);
		this.filterSetText(text);
	};

    previewSet (preview: I.Preview) {
		this.previewObj = preview;
	};

	graphSet (graph: Partial<Graph>) {
		this.graphObj = Object.assign(this.graphObj, graph);

		Storage.set('graph', this.graphObj);
		$(window).trigger('updateGraphSettings');
	};

	toastSet (toast: I.Toast) {
		const { objectId, targetId, originId } = toast;
		const ids = [ objectId, targetId, originId ].filter(it => it);

		if (ids.length) {
			UtilObject.getByIds(ids, (objects: any[]) => {
				const map = UtilCommon.mapToObject(objects, 'id');

				if (targetId && map[targetId]) {
					toast.target = map[targetId];
				};

				if (objectId && map[objectId]) {
					toast.object = map[objectId];
				};

				if (originId && map[originId]) {
					toast.origin = map[originId];
				};

				this.toastObj = toast;
			});
		} else {
			this.toastObj = toast;
		};
	};

	spaceSet (id: string) {
		this.spaceId = String(id || '');
	};


	previewClear () {
		this.previewObj = { type: null, target: null, element: null, range: { from: 0, to: 0 }, marks: [] };
	};

	toastClear () {
		this.toastObj = null;
	};

	typeSet (v: string) {
		this.defaultType = String(v || '');

		Storage.set('defaultType', this.defaultType);
	};

	pinTimeSet (v: string) {
		this.pinTimeId = Number(v) || Constant.default.pinTime;

		Storage.set('pinTime', this.pinTimeId);
	};

	autoSidebarSet (v: boolean) {
		this.boolSet('autoSidebar', v);
	};

	isSidebarFixedSet (v: boolean) {
		this.boolSet('isSidebarFixed', v);
	};

	showRelativeDatesSet (v: boolean) {
		this.boolSet('showRelativeDates', v);
	};

	fullscreenObjectSet (v: boolean) {
		this.boolSet('fullscreenObject', v);
	};

	fullscreenSet (v: boolean) {
		const body = $('body');
		
		this.isFullScreen = v;
		v ? body.addClass('isFullScreen') : body.removeClass('isFullScreen');

		$(window).trigger('resize');
	};

	themeSet (v: string) {
		this.themeId = String(v || '');
		this.setThemeClass();
	};

	redirectSet (v: string) {
		this.redirect = v;
	};

	notionTokenSet (v: string) {
		this.notionToken = v;
	};

	boolGet (k: string) {
		const tk = `${k}Value`;
		if (this[tk] === null) {
			this[tk] = Storage.get(k);
		};
		return !!this[tk];
	};

	boolSet (k: string, v: boolean) {
		v = Boolean(v);

		this[`${k}Value`] = v;
		Storage.set(k, v);
	};

	getThemeClass () {
		let ret = '';

		if (this.themeId == 'system') {
			ret = this.nativeThemeIsDark ? 'dark' : '';
		} else {
			ret = this.themeId;
		};

		return String(ret || '');
	};

	setThemeClass () {
		const head = $('head');
		const c = this.getThemeClass();

		UtilCommon.addBodyClass('theme', c);
		Renderer.send('setBackground', c);

		head.find('#link-prism').remove();
		if (c) {
			head.append(`<link id="link-prism" rel="stylesheet" href="./css/theme/${c}/prism.css" />`);
		};

		$(window).trigger('updateTheme');
	};

	getThemePath () {
		const c = this.getThemeClass();
		return c ? `theme/${c}/` : '';
	};

	nativeThemeSet (isDark: boolean) {
		this.nativeThemeIsDark = isDark;
	};

	languagesSet (v: string[]) {
		this.languages = v;
	};

	configSet (config: any, force: boolean) {
		const html = $('html');
		
		let newConfig: any = {};
		if (force) {
			newConfig = Object.assign(newConfig, config);
		} else {
			for (const k in config) {
				if (undefined === this.configObj[k]) {
					newConfig[k] = config[k];
				};
			};
		};

		set(this.configObj, newConfig);

		this.configObj.debug = this.configObj.debug || {};
		this.configObj.debug.ui ? html.addClass('debug') : html.removeClass('debug');
	};

	spaceStorageSet (value: Partial<SpaceStorage>) {
		set(this.spaceStorageObj, Object.assign(this.spaceStorageObj, value));
	};

};

export const commonStore: CommonStore = new CommonStore();