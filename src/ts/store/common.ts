import $ from 'jquery';
import { action, computed, intercept, makeObservable, observable, set } from 'mobx';
import { I, M, S, U, J, Storage, Renderer } from 'Lib';

interface Filter {
	from: number;
	text: string;
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

	public dataPathValue = '';
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
	public emailConfirmationTimeId = 0;
	public isFullScreen = false;
	public redirect = '';
	public languages: string[] = [];
	public spaceId = '';
	public notionToken = '';
	public showRelativeDatesValue = null;
	public fullscreenObjectValue = null;
	public navigationMenuValue = null;
	public linkStyleValue = null;
	public isOnlineValue = false;
	public shareTooltipValue = false;
	public showVaultValue = null;
	public hideSidebarValue = null;
	public showObjectValue = null;
	public gallery = {
		categories: [],
		list: [],
	};
	public diffValue: I.Diff[] = [];
	public refs: Map<string, any> = new Map();

	public previewObj: I.Preview = { 
		type: null, 
		target: null, 
		element: null, 
		range: { from: 0, to: 0 }, 
		marks: [],
	};

	private graphObj: I.GraphSettings = { 
		icon: true,
		preview: true,
		orphan: true,
		marker: true,
		label: true,
		relation: true,
		files: false,
		link: true,
		local: false,
		cluster: false,
		filter: '',
		depth: 1,
	};

	public spaceStorageObj: SpaceStorage = {
		bytesLimit: 0,
		localUsage: 0,
		spaces: [],
	};

	public membershipTiersList: I.MembershipTier[] = [];

	constructor () {
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
			fullscreenObjectValue: observable,
			navigationMenuValue: observable,
			linkStyleValue: observable,
			isOnlineValue: observable,
			shareTooltipValue: observable,
			showVaultValue: observable,
			hideSidebarValue: observable,
			showObjectValue: observable,
			spaceId: observable,
			membershipTiersList: observable,
			config: computed,
			progress: computed,
			preview: computed,
			toast: computed,
			filter: computed,
			gateway: computed,
			theme: computed,
			nativeTheme: computed,
			membershipTiers: computed,
			space: computed,
			isOnline: computed,
			shareTooltip: computed,
			showVault: computed,
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
			navigationMenuSet: action,
			linkStyleSet: action,
			isOnlineSet: action,
			shareTooltipSet: action,
			membershipTiersListSet: action,
			showVaultSet: action,
			showObjectSet: action,
		});

		intercept(this.configObj as any, change => U.Common.intercept(this.configObj, change));
	};

	get config (): any {
		const config = window.AnytypeGlobalConfig || this.configObj || {};

		config.languages = config.languages || [];
		config.debug = config.debug || {};
		config.flagsMw = config.flagsMw || {};

		return config;
	};

	get progress (): I.Progress {
		return this.progressObj;
	};

	get preview (): I.Preview {
		return this.previewObj;
	};

	get toast (): I.Toast {
		return this.toastObj;
	};

	get filter (): Filter {
		return this.filterObj;
	};

	get gateway (): string {
		return String(this.gatewayUrl || '');
	};

	get type (): string {
		const key = String(this.defaultType || Storage.get('defaultType') || J.Constant.default.typeKey);

		let type = S.Record.getTypeByKey(key);
		if (!type || !type.isInstalled || !U.Object.isAllowedObject(type.recommendedLayout)) {
			type = S.Record.getTypeByKey(J.Constant.default.typeKey);
		};

		return type ? type.id : '';
	};

	get fullscreen (): boolean {
		return this.isFullScreen;
	};

	get pinTime (): number {
		return (Number(this.pinTimeId) || Storage.get('pinTime') || J.Constant.default.pinTime) * 1000;
	};

	get emailConfirmationTime (): number {
		return Number(this.emailConfirmationTimeId) || Storage.get('emailConfirmationTime') || 0;
	};

	get fullscreenObject (): boolean {
		return this.boolGet('fullscreenObject');
	};

	get hideSidebar (): boolean {
		return this.boolGet('hideSidebar');
	};

	get showObject (): boolean {
		return this.showObjectValue;
	};

	get theme (): string {
		return String(this.themeId || '');
	};

	get nativeTheme (): string {
		return this.nativeThemeIsDark ? 'dark' : '';
	};

	get space (): string {
		return String(this.spaceId || '');
	};

	get spaceStorage (): SpaceStorage {
		const spaces = this.spaceStorageObj.spaces || [];
		return { ...this.spaceStorageObj, spaces };
	};

	get interfaceLang (): string {
		return this.config.interfaceLang || J.Constant.default.interfaceLang;
	};

	get showRelativeDates (): boolean {
		return this.boolGet('showRelativeDates');
	};

	get navigationMenu (): I.NavigationMenuMode {
		let ret = this.navigationMenuValue;
		if (ret === null) {
			ret = Storage.get('navigationMenu');
		};
		return Number(ret) || I.NavigationMenuMode.Hover;
	};

	get linkStyle (): I.LinkCardStyle {
		let ret = this.linkStyleValue;
		if (ret === null) {
			ret = Storage.get('linkStyle');
		};
		if (undefined === ret) {
			ret = I.LinkCardStyle.Card;
		};
		return Number(ret) || I.LinkCardStyle.Text;
	};

	get dataPath (): string {
		return String(this.dataPathValue || '');
	};

	get isOnline (): boolean {
		return Boolean(this.isOnlineValue);
	};

	get shareTooltip (): boolean {
		return Boolean(this.shareTooltipValue);
	};

	get membershipTiers (): I.MembershipTier[] {
		return this.membershipTiersList || [];
	};

	get diff (): I.Diff[] {
		return this.diffValue || [];
	};

	get showVault (): boolean {
		let ret = this.showVaultValue;
		if (ret === null) {
			ret = Storage.get('showVault');
		};
		if (undefined === ret) {
			ret = true;
		};
		return ret;
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

	graphSet (key: string, param: Partial<I.GraphSettings>) {
		Storage.set(key, Object.assign(this.getGraph(key), param));
		$(window).trigger('updateGraphSettings');
	};

	toastSet (toast: I.Toast) {
		const { objectId, targetId, originId } = toast;
		const ids = [ objectId, targetId, originId ].filter(it => it);

		if (ids.length) {
			U.Object.getByIds(ids, (objects: any[]) => {
				const map = U.Common.mapToObject(objects, 'id');

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
		this.pinTimeId = Number(v) || J.Constant.default.pinTime;

		Storage.set('pinTime', this.pinTimeId);
	};

	emailConfirmationTimeSet (t: number) {
		this.emailConfirmationTimeId = t;

		Storage.set('emailConfirmationTime', this.emailConfirmationTimeId);
	};

	showRelativeDatesSet (v: boolean) {
		this.boolSet('showRelativeDates', v);
	};

	fullscreenObjectSet (v: boolean) {
		this.boolSet('fullscreenObject', v);
	};

	hideSidebarSet (v: boolean) {
		this.boolSet('hideSidebar', v);
	};

	showObjectSet (v: boolean) {
		this.showObjectValue = v;
	};

	fullscreenSet (v: boolean) {
		const body = $('body');
		
		this.isFullScreen = v;
		v ? body.addClass('isFullScreen') : body.removeClass('isFullScreen');

		$(window).trigger('resize');
	};

	showVaultSet (v: boolean) {
		this.boolSet('showVault', v);
	};

	themeSet (v: string) {
		this.themeId = String(v || '');
		this.setThemeClass();
	};

	redirectSet (v: string) {
		const param = U.Router.getParam(v);

		if ((param.page == 'auth') && (param.action == 'pin-check')) {
			return;
		};

		this.redirect = v;
	};

	notionTokenSet (v: string) {
		this.notionToken = v;
	};

	refSet (id: string, ref: any) {
		this.refs.set(id, ref);
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

		U.Common.addBodyClass('theme', c);
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

	navigationMenuSet (v: I.NavigationMenuMode) {
		v = Number(v);
		this.navigationMenuValue = v;
		Storage.set('navigationMenu', v);
	};

	linkStyleSet (v: I.NavigationMenuMode) {
		v = Number(v);
		this.linkStyleValue = v;
		Storage.set('linkStyle', v);
	};

	isOnlineSet (v: boolean) {
		this.isOnlineValue = Boolean(v);
		console.log('[Online status]:', v);
	};

	shareTooltipSet (v: boolean) {
		this.shareTooltipValue = Boolean(v);
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

	dataPathSet (v: string) {
		this.dataPathValue = String(v || '');
	};

	membershipTiersListSet (list: I.MembershipTier[]) {
		this.membershipTiersList = (list || []).map(it => new M.MembershipTier(it));
	};

	diffSet (diff: I.Diff[]) {
		this.diffValue = diff || [];
	};

	getGraph (key: string): I.GraphSettings {
		const stored = Storage.get(key);
		const def = U.Common.objectCopy(this.graphObj);

		return Object.assign(def, stored);
	};

	getRef (id: string) {
		return this.refs.get(id);
	};

};

export const Common: CommonStore = new CommonStore();