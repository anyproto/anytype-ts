import { action, computed, makeObservable, observable, set } from 'mobx';
import $ from 'jquery';
import { analytics, I, Storage, Util, ObjectUtil, Renderer } from 'Lib';
import { blockStore, dbStore } from 'Store';
import Constant from 'json/constant.json';
import * as Sentry from '@sentry/browser';

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
	filter: string;
};

interface SpaceStorage {
	bytesUsed: number;
	bytesLimit: number;
	localUsage: number;
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
	public typeId = '';
	public pinTimeId = 0;
	public isFullScreen = false;
	public autoSidebarValue = false;
	public isSidebarFixedValue = false;
	public redirect = '';
	public languages: string[] = [];
	public workspaceId = '';
	public notionToken = '';

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
		filter: '',
	};

	public spaceStorageObj: SpaceStorage = {
		bytesUsed: 0,
		bytesLimit: 0,
		localUsage: 0,
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
			typeId: observable,
			isFullScreen: observable,
			autoSidebarValue: observable,
			isSidebarFixedValue: observable,
			workspaceId: observable,
            config: computed,
            progress: computed,
            preview: computed,
			toast: computed,
            filter: computed,
            gateway: computed,
			theme: computed,
			nativeTheme: computed,
			workspace: computed,
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
			workspaceSet: action,
			spaceStorageSet: action,
		});
    };

    get config(): any {
		return window.Config || { ...this.configObj, debug: this.configObj.debug || {} };
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
		const typeId = String(this.typeId || Storage.get('defaultType') || '');

		if (!typeId) {
			return Constant.typeId.note;
		};

		const type = dbStore.getType(typeId);

		if (!type || !type.isInstalled || !ObjectUtil.getPageLayouts().includes(type.recommendedLayout)) {
			return Constant.typeId.note;
		};

		return typeId;
	};

	get fullscreen(): boolean {
		return this.isFullScreen;
	};

	get pinTime(): number {
		return (Number(this.pinTimeId) || Storage.get('pinTime') || Constant.default.pinTime) * 1000;
	};

	get autoSidebar(): boolean {
		return Boolean(this.autoSidebarValue || Storage.get('autoSidebar'));
	};

	get isSidebarFixed(): boolean {
		return Boolean(this.isSidebarFixedValue)  || Storage.get('isSidebarFixed');
	};

	get theme(): string {
		return String(this.themeId || '');
	};

	get nativeTheme(): string {
		return this.nativeThemeIsDark ? 'dark' : '';
	};

	get workspace(): string {
		return String(this.workspaceId || '');
	};

	get graph(): Graph {
		return Object.assign(this.graphObj, Storage.get('graph') || {});
	};

	get spaceStorage (): SpaceStorage {
		let { bytesUsed, localUsage } = this.spaceStorageObj;
		
		if (bytesUsed <= 1024 * 1024) {
			bytesUsed = 0;
		};
		if (localUsage <= 1024 * 1024) {
			localUsage = 0;
		};

		return { ...this.spaceStorageObj, bytesUsed, localUsage };
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
			ObjectUtil.getByIds(ids, (objects: any[]) => {
				const map = Util.mapToObject(objects, 'id');

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

	workspaceSet (id: string) {
		this.workspaceId = String(id || '');
	};

	previewClear () {
		this.previewObj = { type: null, target: null, element: null, range: { from: 0, to: 0 }, marks: [] };
	};

	toastClear () {
		this.toastObj = null;
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

	isSidebarFixedSet (v: boolean) {
		this.isSidebarFixedValue = Boolean(v);
		Storage.set('isSidebarFixed', this.isSidebarFixedValue);
	};

	fullscreenSet (v: boolean) {
		const body = $('body');
		
		this.isFullScreen = v;
		v ? body.addClass('isFullScreen') : body.removeClass('isFullScreen');

		$(window).trigger('resize');
	};

	themeSet (v: string) {
		this.themeId = v;
		Storage.set('theme', v);
		
		this.setThemeClass();
	};

	redirectSet (v: string) {
		this.redirect = v;
	};

	notionTokenSet (v: string) {
		this.notionToken = v;
	};

	getThemeClass () {
		if (this.themeId == 'system') {
			return this.nativeThemeIsDark ? 'dark' : '';
		} else {
			return this.themeId;
		};
	};

	setThemeClass() {
		const head = $('head');
		const c = this.getThemeClass();

		Util.addBodyClass('theme', c);
		Renderer.send('setBackground', c);

		head.find('#link-prism').remove();
		if (c == 'dark') {
			head.append(`<link id="link-prism" rel="stylesheet" href="./css/theme/${c}/prism.css" />`);
		};

		$(window).trigger('updateTheme');
	};

	nativeThemeSet (isDark: boolean) {
		this.nativeThemeIsDark = isDark;
	};

	languagesSet (v: string[]) {
		this.languages = v;
	};

	infoSet (info: I.AccountInfo) {
		console.log('[commonStore.infoSet]', info);

		blockStore.profileSet(info.profileObjectId);
		blockStore.widgetsSet(info.widgetsId);

		this.gatewaySet(info.gatewayUrl);
		this.workspaceSet(info.accountSpaceId);

		analytics.device(info.deviceId);
		analytics.profile(info.analyticsId);
		Sentry.setUser({ id: info.analyticsId });
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

	spaceStorageSet (usage: any) {
		set(this.spaceStorageObj, Object.assign(this.spaceStorageObj, usage));
	};

};

export const commonStore: CommonStore = new CommonStore();